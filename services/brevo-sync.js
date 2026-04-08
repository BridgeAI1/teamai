const axios = require('axios');
const activityLog = require('../data/activity-log');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';
const BREVO_LIST_ID = process.env.BREVO_LIST_ID || 9;

/**
 * Make Brevo API request
 */
async function makeBrevoRequest(method, endpoint, data = null) {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured, skipping sync');
    return { success: false, message: 'Brevo not configured' };
  }

  try {
    const config = {
      method,
      url: `${BREVO_API_URL}${endpoint}`,
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Brevo API error on ${endpoint}:`, error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

/**
 * Sync lead from email
 */
async function syncLeadFromEmail({ from, subject, body, clientId }) {
  try {
    // Extract name and email
    const emailMatch = from.match(/([^<]+)?<(.+?)>|(.+)/);
    const email = emailMatch ? (emailMatch[2] || emailMatch[3]) : from;
    const name = emailMatch && emailMatch[1] ? emailMatch[1].trim() : 'Unknown';

    // Create contact in Brevo
    const createResult = await makeBrevoRequest('POST', '/contacts', {
      email,
      attributes: {
        FIRSTNAME: name.split(' ')[0] || 'Lead',
        LASTNAME: name.split(' ').slice(1).join(' ') || '',
        LEADINQUIRY: subject,
        SOURCE: 'email',
        RECEIVED_AT: new Date().toISOString()
      },
      listIds: [parseInt(BREVO_LIST_ID)]
    });

    if (createResult.success) {
      activityLog.log({
        type: 'brevo_contact_created',
        email,
        name,
        clientId
      });

      return { success: true, message: 'Contact synced to Brevo', email };
    } else {
      // Try to update existing contact
      const updateResult = await makeBrevoRequest('POST', `/contacts/email/${email}`, {
        attributes: {
          FIRSTNAME: name.split(' ')[0] || 'Lead',
          LASTNAME: name.split(' ').slice(1).join(' ') || '',
          LEADINQUIRY: subject,
          SOURCE: 'email',
          RECEIVED_AT: new Date().toISOString()
        },
        listIds: [parseInt(BREVO_LIST_ID)]
      });

      if (updateResult.success) {
        activityLog.log({
          type: 'brevo_contact_updated',
          email,
          clientId
        });

        return { success: true, message: 'Contact updated in Brevo', email };
      }

      return updateResult;
    }
  } catch (error) {
    console.error('Error syncing lead:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync contact from document
 */
async function syncContactFromDocument({ data, documentType, clientId }) {
  try {
    const email = data.email || data.email_address;
    if (!email) {
      return { success: false, message: 'No email found in document data' };
    }

    const name = data.name || data.contact_name || data.client_name || '';
    const company = data.company || data.company_name || '';

    const result = await makeBrevoRequest('POST', '/contacts', {
      email,
      attributes: {
        FIRSTNAME: name.split(' ')[0] || documentType,
        LASTNAME: name.split(' ').slice(1).join(' ') || '',
        COMPANY: company,
        SOURCE: documentType,
        DOCUMENT_TYPE: documentType,
        RECEIVED_AT: new Date().toISOString()
      },
      listIds: [parseInt(BREVO_LIST_ID)]
    });

    if (result.success) {
      activityLog.log({
        type: 'brevo_document_contact_synced',
        email,
        documentType,
        clientId
      });
    }

    return result;
  } catch (error) {
    console.error('Error syncing contact from document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get list details
 */
async function getListDetails(listId = BREVO_LIST_ID) {
  try {
    const result = await makeBrevoRequest('GET', `/contacts/lists/${listId}`);
    return result;
  } catch (error) {
    console.error('Error getting list details:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get contact details
 */
async function getContact(email) {
  try {
    const result = await makeBrevoRequest('GET', `/contacts/${email}`);
    return result;
  } catch (error) {
    console.error('Error getting contact:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send transactional email via Brevo
 */
async function sendTransactionalEmail({ to, subject, body, sender = null }) {
  try {
    const senderName = process.env.BREVO_SENDER_NAME || 'TeamAI';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BUSINESS_EMAIL || 'noreply@example.com';

    const result = await makeBrevoRequest('POST', '/smtp/email', {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: formatEmailBody(body),
      textContent: body
    });

    return result;
  } catch (error) {
    console.error('Error sending transactional email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format email body to HTML
 */
function formatEmailBody(text) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          ${text.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('')}
          <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px; margin-bottom: 20px;">
          <p style="font-size: 12px; color: #999;">
            This email was sent by TeamAI for BridgeAI.
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Create/update multiple contacts
 */
async function batchSyncContacts(contacts) {
  try {
    const result = await makeBrevoRequest('POST', '/contacts/import', {
      jsonBody: contacts.map(contact => ({
        email: contact.email,
        attributes: {
          FIRSTNAME: contact.firstName || 'Contact',
          LASTNAME: contact.lastName || '',
          COMPANY: contact.company || '',
          PHONE: contact.phone || '',
          SOURCE: contact.source || 'import'
        },
        listIds: [parseInt(BREVO_LIST_ID)]
      }))
    });

    if (result.success) {
      activityLog.log({
        type: 'brevo_batch_sync',
        count: contacts.length
      });
    }

    return result;
  } catch (error) {
    console.error('Error batch syncing contacts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get list subscribers
 */
async function getListSubscribers(listId = BREVO_LIST_ID, limit = 50, offset = 0) {
  try {
    const result = await makeBrevoRequest(
      'GET',
      `/contacts/lists/${listId}/contacts?limit=${limit}&offset=${offset}`
    );
    return result;
  } catch (error) {
    console.error('Error getting list subscribers:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  syncLeadFromEmail,
  syncContactFromDocument,
  getListDetails,
  getContact,
  sendTransactionalEmail,
  batchSyncContacts,
  getListSubscribers,
  makeBrevoRequest
};
