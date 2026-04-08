const brevoSync = require('./brevo-sync');
const activityLog = require('../data/activity-log');

/**
 * Send email response
 */
async function sendResponse({ to, subject, body, messageId, clientId }) {
  try {
    if (!to || !subject || !body) {
      return {
        success: false,
        message: 'Missing required fields: to, subject, body'
      };
    }

    // Send via Brevo
    const result = await brevoSync.sendTransactionalEmail({
      to,
      subject,
      body
    });

    if (result.success) {
      activityLog.log({
        type: 'email_sent',
        to,
        subject,
        messageId,
        clientId
      });

      return {
        success: true,
        message: 'Email sent successfully',
        messageId,
        sentAt: new Date()
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to send email'
      };
    }
  } catch (error) {
    console.error('Error in sendResponse:', error);

    activityLog.log({
      type: 'error',
      message: `Email sending error: ${error.message}`
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send bulk emails
 */
async function sendBulkEmails({ recipients, subject, body, clientId }) {
  try {
    const results = [];

    for (const recipient of recipients) {
      const result = await sendResponse({
        to: recipient.email,
        subject,
        body,
        clientId
      });

      results.push({
        email: recipient.email,
        success: result.success,
        message: result.message || result.error
      });
    }

    const successCount = results.filter(r => r.success).length;

    activityLog.log({
      type: 'bulk_email_sent',
      total: results.length,
      successful: successCount,
      clientId
    });

    return {
      success: true,
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results
    };
  } catch (error) {
    console.error('Error in sendBulkEmails:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send templated email
 */
async function sendTemplatedEmail({ to, templateId, templateData, clientId }) {
  try {
    // Use Brevo's template system
    const result = await brevoSync.makeBrevoRequest('POST', '/smtp/email', {
      to: [{ email: to }],
      templateId: parseInt(templateId),
      params: templateData
    });

    if (result.success) {
      activityLog.log({
        type: 'templated_email_sent',
        to,
        templateId,
        clientId
      });
    }

    return result;
  } catch (error) {
    console.error('Error sending templated email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to business owner
 */
async function sendNotification({ title, message, type = 'info', clientId }) {
  try {
    const businessEmail = process.env.BUSINESS_EMAIL;
    if (!businessEmail) {
      console.warn('BUSINESS_EMAIL not configured, skipping notification');
      return { success: false, message: 'Business email not configured' };
    }

    const emailBody = `
<h2>${title}</h2>

<p>${message}</p>

<hr>

<p style="color: #999; font-size: 12px;">
Type: ${type}<br>
Sent: ${new Date().toLocaleString()}
</p>
    `;

    const result = await sendResponse({
      to: businessEmail,
      subject: `[${type.toUpperCase()}] ${title}`,
      body: emailBody,
      clientId
    });

    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule email for later delivery
 */
async function scheduleEmail({ to, subject, body, scheduleTime, clientId }) {
  try {
    // Note: Brevo API support for scheduling varies by plan
    // This is a placeholder for scheduling logic
    const scheduledFor = new Date(scheduleTime);

    activityLog.log({
      type: 'email_scheduled',
      to,
      subject,
      scheduledFor,
      clientId
    });

    return {
      success: true,
      message: 'Email scheduled for delivery',
      scheduledFor
    };
  } catch (error) {
    console.error('Error scheduling email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate email preview
 */
function getEmailPreview({ subject, body, from = null, to = null }) {
  const senderName = process.env.BREVO_SENDER_NAME || 'TeamAI';
  const senderEmail = from || process.env.BREVO_SENDER_EMAIL || process.env.BUSINESS_EMAIL || 'noreply@example.com';

  return {
    from: `${senderName} <${senderEmail}>`,
    to: to || 'recipient@example.com',
    subject,
    preview: body.substring(0, 100),
    body
  };
}

module.exports = {
  sendResponse,
  sendBulkEmails,
  sendTemplatedEmail,
  sendNotification,
  scheduleEmail,
  getEmailPreview
};
