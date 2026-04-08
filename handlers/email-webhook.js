const { v4: uuidv4 } = require('uuid');
const claudeAI = require('../services/claude-ai');
const brevoSync = require('../services/brevo-sync');
const emailSender = require('../services/email-sender');
const activityLog = require('../data/activity-log');
const crypto = require('crypto');

// In-memory storage for email drafts (in production, use a database)
const emailDrafts = {};

/**
 * Validate webhook signature
 */
function validateWebhookSignature(req) {
  const secret = process.env.WEBHOOK_SECRET || 'bridgeai-teamai-2026';
  const signature = req.headers['x-webhook-signature'];

  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return hash === signature;
}

/**
 * Receive incoming email webhook
 */
async function receiveEmail(req, res) {
  try {
    // Validate signature
    if (process.env.NODE_ENV === 'production' && !validateWebhookSignature(req)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { from, to, subject, body, html, client_id } = req.body;

    if (!from || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: from, subject, body'
      });
    }

    const emailId = uuidv4();
    const clientId = client_id || process.env.CLIENT_ID || 'default';

    activityLog.log({
      type: 'email_received',
      emailId,
      from,
      to,
      subject,
      clientId
    });

    // Analyze email with Claude
    const analysis = await claudeAI.analyzeEmail({
      from,
      to,
      subject,
      body,
      html,
      clientId
    });

    // Generate draft response
    const draftResponse = await claudeAI.generateEmailResponse({
      email: { from, to, subject, body },
      analysis,
      clientId
    });

    // Create draft record
    const draft = {
      id: emailId,
      from,
      to,
      subject,
      originalBody: body,
      analysis,
      draftResponse,
      status: 'pending',
      createdAt: new Date(),
      clientId
    };

    emailDrafts[emailId] = draft;

    activityLog.log({
      type: 'email_draft_created',
      emailId,
      category: analysis.category,
      sentiment: analysis.sentiment
    });

    // If auto-response is enabled and no approval required, send immediately
    if (process.env.ENABLE_AUTO_RESPONSE === 'true' && process.env.APPROVAL_WORKFLOW_REQUIRED !== 'true') {
      await sendDraft(emailId);

      return res.json({
        success: true,
        message: 'Email processed and response sent automatically',
        emailId,
        status: 'sent',
        draftResponse
      });
    }

    // Otherwise, return draft for review
    res.json({
      success: true,
      message: 'Email analyzed, draft created and awaiting approval',
      emailId,
      status: 'pending_approval',
      analysis,
      draftResponse
    });

  } catch (error) {
    console.error('Error in receiveEmail:', error);

    activityLog.log({
      type: 'error',
      message: `Email webhook error: ${error.message}`
    });

    res.status(500).json({
      success: false,
      message: 'Error processing email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all email drafts
 */
function getDrafts(req, res) {
  try {
    const drafts = Object.values(emailDrafts).map(draft => ({
      id: draft.id,
      from: draft.from,
      to: draft.to,
      subject: draft.subject,
      status: draft.status,
      category: draft.analysis?.category,
      sentiment: draft.analysis?.sentiment,
      createdAt: draft.createdAt,
      draftResponse: draft.draftResponse
    }));

    res.json({
      success: true,
      total: drafts.length,
      drafts
    });
  } catch (error) {
    console.error('Error in getDrafts:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving drafts'
    });
  }
}

/**
 * Approve and send a draft email
 */
async function approveDraft(req, res) {
  try {
    const { id } = req.params;
    const { customResponse } = req.body;

    const draft = emailDrafts[id];
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    if (draft.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve draft with status: ${draft.status}`
      });
    }

    // Use custom response if provided, otherwise use draft
    const response = customResponse || draft.draftResponse;

    // Send email
    const sent = await emailSender.sendResponse({
      to: draft.from,
      subject: `Re: ${draft.subject}`,
      body: response,
      messageId: id,
      clientId: draft.clientId
    });

    if (!sent.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: sent.error
      });
    }

    // Update draft status
    draft.status = 'sent';
    draft.sentAt = new Date();
    draft.sentResponse = response;

    // Sync to CRM if it's a lead
    if (draft.analysis?.category === 'lead_inquiry') {
      await brevoSync.syncLeadFromEmail({
        from: draft.from,
        subject: draft.subject,
        body: draft.originalBody,
        clientId: draft.clientId
      });
    }

    activityLog.log({
      type: 'email_sent',
      emailId: id,
      to: draft.from,
      category: draft.analysis?.category
    });

    res.json({
      success: true,
      message: 'Draft approved and sent',
      emailId: id,
      sentAt: draft.sentAt
    });

  } catch (error) {
    console.error('Error in approveDraft:', error);

    activityLog.log({
      type: 'error',
      message: `Draft approval error: ${error.message}`
    });

    res.status(500).json({
      success: false,
      message: 'Error sending draft',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Reject a draft email
 */
function rejectDraft(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const draft = emailDrafts[id];
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    draft.status = 'rejected';
    draft.rejectedAt = new Date();
    draft.rejectionReason = reason || 'No reason provided';

    activityLog.log({
      type: 'email_draft_rejected',
      emailId: id,
      reason: draft.rejectionReason
    });

    res.json({
      success: true,
      message: 'Draft rejected',
      emailId: id
    });

  } catch (error) {
    console.error('Error in rejectDraft:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting draft'
    });
  }
}

/**
 * Internal function to send a draft
 */
async function sendDraft(draftId) {
  const draft = emailDrafts[draftId];
  if (!draft) throw new Error(`Draft ${draftId} not found`);

  const sent = await emailSender.sendResponse({
    to: draft.from,
    subject: `Re: ${draft.subject}`,
    body: draft.draftResponse,
    messageId: draftId,
    clientId: draft.clientId
  });

  if (sent.success) {
    draft.status = 'sent';
    draft.sentAt = new Date();
  }

  return sent;
}

module.exports = {
  receiveEmail,
  getDrafts,
  approveDraft,
  rejectDraft
};
