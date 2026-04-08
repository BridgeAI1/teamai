const { v4: uuidv4 } = require('uuid');
const claudeAI = require('../services/claude-ai');
const brevoSync = require('../services/brevo-sync');
const activityLog = require('../data/activity-log');

// In-memory storage for processed documents
const processedDocuments = {};

/**
 * Process document and extract structured data
 */
async function processDocument(req, res) {
  try {
    const {
      documentContent,
      documentType,
      documentFormat,
      clientId,
      outputFormat = 'json',
      language = 'en'
    } = req.body;

    if (!documentContent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: documentContent (base64 encoded)'
      });
    }

    const docId = uuidv4();
    const clientIdVal = clientId || process.env.CLIENT_ID || 'default';

    activityLog.log({
      type: 'document_received',
      docId,
      documentType,
      documentFormat,
      clientId: clientIdVal
    });

    // Decode document content if base64
    let decodedContent = documentContent;
    if (documentFormat === 'base64') {
      decodedContent = Buffer.from(documentContent, 'base64').toString('utf-8');
    }

    // Extract data using Claude
    const extractedData = await claudeAI.extractDocumentData({
      content: decodedContent,
      documentType,
      language,
      clientId: clientIdVal
    });

    // Store processed document
    const processedDoc = {
      id: docId,
      documentType,
      documentFormat,
      extractedData,
      outputFormat,
      createdAt: new Date(),
      clientId: clientIdVal
    };

    processedDocuments[docId] = processedDoc;

    // Format output
    const formattedOutput = formatOutput(extractedData, outputFormat);

    // Sync to Brevo if it contains lead or contact info
    if (extractedData.email || extractedData.name) {
      await brevoSync.syncContactFromDocument({
        data: extractedData,
        documentType,
        clientId: clientIdVal
      });
    }

    activityLog.log({
      type: 'document_processed',
      docId,
      documentType,
      fields: Object.keys(extractedData).length
    });

    res.json({
      success: true,
      message: 'Document processed successfully',
      docId,
      documentType,
      extractedData,
      formattedOutput,
      fieldsExtracted: Object.keys(extractedData).length
    });

  } catch (error) {
    console.error('Error in processDocument:', error);

    activityLog.log({
      type: 'error',
      message: `Document processing error: ${error.message}`
    });

    res.status(500).json({
      success: false,
      message: 'Error processing document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Format extracted data to desired output format
 */
function formatOutput(data, format) {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'csv') {
    return convertToCSV(data);
  }

  if (format === 'xml') {
    return convertToXML(data);
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Convert object to CSV format
 */
function convertToCSV(obj) {
  const keys = Object.keys(obj);
  const values = Object.values(obj).map(v =>
    typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
  );

  return `${keys.join(',')}\n${values.join(',')}`;
}

/**
 * Convert object to XML format
 */
function convertToXML(obj) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<document>\n';

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    xml += `  <${sanitizedKey}>${escapeXml(value)}</${sanitizedKey}>\n`;
  }

  xml += '</document>';
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Get processed document details
 */
function getDocumentStatus(req, res) {
  try {
    const { docId } = req.params;

    const doc = processedDocuments[docId];
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      docId: doc.id,
      documentType: doc.documentType,
      createdAt: doc.createdAt,
      fieldsExtracted: Object.keys(doc.extractedData).length,
      extractedData: doc.extractedData
    });

  } catch (error) {
    console.error('Error in getDocumentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving document'
    });
  }
}

module.exports = {
  processDocument,
  getDocumentStatus
};
