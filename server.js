const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const emailWebhookHandler = require('./handlers/email-webhook');
const documentProcessorHandler = require('./handlers/document-processor');
const workflowEngineHandler = require('./handlers/workflow-engine');
const statusHandler = require('./handlers/status');
const activityLog = require('./data/activity-log');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Status endpoint (root)
app.get('/', statusHandler.getDashboard);
app.get('/api/health', statusHandler.getHealth);

// Email handling
app.post('/webhook/email', emailWebhookHandler.receiveEmail);

// Document processing
app.post('/api/process-document', documentProcessorHandler.processDocument);

// Workflow management
app.post('/api/workflow/trigger', workflowEngineHandler.triggerWorkflow);
app.get('/api/workflows', workflowEngineHandler.getWorkflows);

// Activity and draft management
app.get('/api/activity', activityLog.getActivity);
app.get('/api/drafts', emailWebhookHandler.getDrafts);
app.post('/api/drafts/:id/approve', emailWebhookHandler.approveDraft);
app.post('/api/drafts/:id/reject', emailWebhookHandler.rejectDraft);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  activityLog.log({
    type: 'error',
    message: err.message,
    stack: err.stack,
    endpoint: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TeamAI server running on port ${PORT}`);
  console.log(`Business: ${process.env.BUSINESS_NAME || 'BridgeAI'}`);
  console.log(`Email: ${process.env.BUSINESS_EMAIL || 'not configured'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Validate required env vars
  const requiredEnvVars = ['ANTHROPIC_API_KEY', 'BREVO_API_KEY'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  }
});

module.exports = app;
