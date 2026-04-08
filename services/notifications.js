const emailSender = require('./email-sender');
const activityLog = require('../data/activity-log');

/**
 * Notification templates
 */
const NOTIFICATION_TEMPLATES = {
  lead_received: {
    title: 'New Lead Received',
    getMessage: (data) => `
A new lead inquiry has been received:

From: ${data.from}
Subject: ${data.subject}
Quality: ${data.quality || 'Unknown'}

View draft response: /api/drafts
    `
  },
  document_processed: {
    title: 'Document Processed',
    getMessage: (data) => `
A document has been successfully processed:

Type: ${data.documentType}
Fields Extracted: ${data.fieldsCount || 0}
Status: Ready for review

View results: /api/documents/${data.docId}
    `
  },
  workflow_completed: {
    title: 'Workflow Executed',
    getMessage: (data) => `
Workflow "${data.workflowName}" has completed:

Status: ${data.status}
Steps: ${data.stepsCompleted}/${data.totalSteps}
Duration: ${data.duration}ms

Execution ID: ${data.executionId}
    `
  },
  workflow_failed: {
    title: 'Workflow Failed',
    getMessage: (data) => `
Workflow "${data.workflowName}" encountered an error:

Status: ${data.status}
Failed Step: ${data.failedStep}
Error: ${data.error}

Please review and retry manually.
    `
  },
  daily_summary: {
    title: 'Daily Activity Summary',
    getMessage: (data) => `
TeamAI Daily Summary for ${new Date().toLocaleDateString()}:

Emails Processed: ${data.emailsProcessed || 0}
Documents Processed: ${data.documentsProcessed || 0}
Workflows Executed: ${data.workflowsExecuted || 0}
API Errors: ${data.apiErrors || 0}

System Status: ${data.systemStatus || 'Operational'}
    `
  },
  system_alert: {
    title: 'System Alert',
    getMessage: (data) => `
ALERT: ${data.alertType}

Message: ${data.message}
Severity: ${data.severity || 'medium'}
Time: ${new Date().toLocaleString()}

Action Required: ${data.actionRequired ? 'Yes' : 'No'}
    `
  }
};

/**
 * Send notification
 */
async function sendNotification({
  type,
  data,
  recipients = null,
  includeOwner = true,
  clientId
}) {
  try {
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      console.warn(`Unknown notification type: ${type}`);
      return { success: false, message: 'Unknown notification type' };
    }

    const title = template.title;
    const message = template.getMessage(data);

    // Build recipient list
    const emailRecipients = recipients || [];

    if (includeOwner) {
      const businessEmail = process.env.BUSINESS_EMAIL;
      if (businessEmail && !emailRecipients.includes(businessEmail)) {
        emailRecipients.push(businessEmail);
      }
    }

    if (emailRecipients.length === 0) {
      console.warn('No recipients for notification');
      return { success: false, message: 'No recipients configured' };
    }

    // Send to each recipient
    const results = [];
    for (const recipient of emailRecipients) {
      const result = await emailSender.sendNotification({
        title,
        message,
        type,
        clientId
      });

      results.push({
        recipient,
        success: result.success
      });
    }

    // Log notification
    activityLog.log({
      type: 'notification_sent',
      notificationType: type,
      recipientCount: emailRecipients.length,
      clientId
    });

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `Notification sent to ${successCount}/${emailRecipients.length} recipients`,
      results
    };

  } catch (error) {
    console.error('Error in sendNotification:', error);

    activityLog.log({
      type: 'error',
      message: `Notification error: ${error.message}`
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send alert notification
 */
async function sendAlert({ alertType, message, severity = 'medium', actionRequired = false, clientId }) {
  return sendNotification({
    type: 'system_alert',
    data: {
      alertType,
      message,
      severity,
      actionRequired
    },
    includeOwner: true,
    clientId
  });
}

/**
 * Send lead notification
 */
async function sendLeadNotification({ from, subject, quality, clientId }) {
  return sendNotification({
    type: 'lead_received',
    data: {
      from,
      subject,
      quality
    },
    includeOwner: true,
    clientId
  });
}

/**
 * Send document processed notification
 */
async function sendDocumentNotification({ documentType, fieldsCount, docId, clientId }) {
  return sendNotification({
    type: 'document_processed',
    data: {
      documentType,
      fieldsCount,
      docId
    },
    includeOwner: true,
    clientId
  });
}

/**
 * Send workflow notification
 */
async function sendWorkflowNotification({
  workflowName,
  status,
  stepsCompleted,
  totalSteps,
  duration,
  executionId,
  failedStep,
  error,
  clientId
}) {
  const notificationType = status === 'failed' ? 'workflow_failed' : 'workflow_completed';

  return sendNotification({
    type: notificationType,
    data: {
      workflowName,
      status,
      stepsCompleted,
      totalSteps,
      duration,
      executionId,
      failedStep,
      error
    },
    includeOwner: true,
    clientId
  });
}

/**
 * Send daily summary
 */
async function sendDailySummary({ stats, systemStatus, clientId }) {
  return sendNotification({
    type: 'daily_summary',
    data: {
      emailsProcessed: stats.emailsProcessed || 0,
      documentsProcessed: stats.documentsProcessed || 0,
      workflowsExecuted: stats.workflowsExecuted || 0,
      apiErrors: stats.apiErrors || 0,
      systemStatus
    },
    includeOwner: true,
    clientId
  });
}

module.exports = {
  sendNotification,
  sendAlert,
  sendLeadNotification,
  sendDocumentNotification,
  sendWorkflowNotification,
  sendDailySummary,
  NOTIFICATION_TEMPLATES
};
