# TeamAI - AI Employees Service

TeamAI is a production-ready Node.js service that provides "AI Employees" for businesses - digital workers that handle email responses, data processing, and workflow automation.

**Part of the BridgeAI product suite** (alongside VoiceIQ)

## Features

### 1. Email AI Responder
- Receive emails via webhook (forwarding rules or Gmail API)
- Automatic email analysis and categorization (lead, support, complaint, billing, spam, feedback)
- AI-generated draft responses using Claude
- Approval workflow: draft → review → send
- Multi-language support (English, Spanish)
- Industry-specific response templates

### 2. Data Processing Agent
- Upload and process documents (PDF, images, Excel, etc.)
- AI-powered data extraction using Claude
- Structured output formats: JSON, CSV, XML
- Document types: invoices, receipts, contracts, forms, medical records, business cards, passports
- Automatic contact syncing to Brevo CRM

### 3. Workflow Automation Engine
- Pre-built workflow templates by industry (7 verticals)
- Trigger-based automation (new email → analyze → respond → log)
- Step-by-step workflow execution with error handling
- Industries: Dental, Medical, Legal, Auto, Real Estate, Insurance, Restaurant
- Custom workflow creation

### 4. Multi-Tenant Architecture
- Client management with different feature tiers (starter, professional, enterprise)
- Per-client usage limits and feature flags
- CRM integration (Brevo) for lead tracking
- Activity logging and analytics

## Quick Start

### Installation

```bash
# Clone and setup
cd teamai
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
# ANTHROPIC_API_KEY=sk-ant-xxx
# BREVO_API_KEY=xkeysib-xxx
```

### Running Locally

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:3001`

### Deployment to Railway

```bash
railway login
railway link  # Link to existing Railway project
railway up
```

## Configuration

### Environment Variables

```bash
# Core APIs
ANTHROPIC_API_KEY=sk-ant-your-key
BREVO_API_KEY=xkeysib-your-key

# Business Configuration
BUSINESS_NAME=BridgeAI
BUSINESS_EMAIL=alex@bridgeaihq.com
BUSINESS_PHONE=+1-713-000-0000

# CRM Integration
BREVO_LIST_ID=9
BREVO_SENDER_EMAIL=noreply@bridgeaihq.com
BREVO_SENDER_NAME=TeamAI

# Server Configuration
PORT=3001
NODE_ENV=development
WEBHOOK_SECRET=bridgeai-teamai-2026

# Features
ENABLE_AUTO_RESPONSE=true
APPROVAL_WORKFLOW_REQUIRED=false
DEFAULT_RESPONSE_LANGUAGE=en
```

## API Endpoints

### Dashboard & Health
- `GET /` - Beautiful HTML dashboard with system status
- `GET /api/health` - JSON health check

### Email Processing
- `POST /webhook/email` - Receive incoming emails
- `GET /api/drafts` - Get pending email drafts
- `POST /api/drafts/:id/approve` - Approve and send draft
- `POST /api/drafts/:id/reject` - Reject draft with reason

### Document Processing
- `POST /api/process-document` - Upload and extract data from documents
  - Supports: invoice, receipt, contract, form, passport, business_card, medical_form
  - Output formats: json, csv, xml

### Workflow Management
- `POST /api/workflow/trigger` - Trigger a workflow manually
- `GET /api/workflows` - List all available workflows

### Activity & Monitoring
- `GET /api/activity` - Get activity log

## Request Examples

### Receive Email

```bash
curl -X POST http://localhost:3001/webhook/email \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: signature-hash" \
  -d '{
    "from": "customer@example.com",
    "to": "support@company.com",
    "subject": "Question about your service",
    "body": "I would like to know more about pricing...",
    "client_id": "default"
  }'
```

### Process Document

```bash
curl -X POST http://localhost:3001/api/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "base64-encoded-pdf-or-image",
    "documentType": "invoice",
    "documentFormat": "base64",
    "outputFormat": "json",
    "client_id": "default"
  }'
```

### Trigger Workflow

```bash
curl -X POST http://localhost:3001/api/workflow/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "dental-lead-response",
    "triggerData": {
      "from": "patient@example.com",
      "to": "clinic@dentist.com",
      "subject": "I need a dental appointment",
      "body": "Can I schedule for next week?"
    },
    "client_id": "default"
  }'
```

### Approve Draft

```bash
curl -X POST http://localhost:3001/api/drafts/email-uuid/approve \
  -H "Content-Type: application/json" \
  -d '{
    "customResponse": "Custom response text (optional)"
  }'
```

## Architecture

### Directory Structure

```
teamai/
├── server.js                  # Main Express server
├── package.json              # Dependencies
├── .env.example              # Configuration template
├── Dockerfile                # Docker image
├── railway.json              # Railway deployment config
├── handlers/                 # HTTP request handlers
│   ├── email-webhook.js     # Email processing
│   ├── document-processor.js # Document extraction
│   ├── workflow-engine.js    # Workflow execution
│   └── status.js             # Dashboard & health
├── services/                 # Business logic
│   ├── claude-ai.js         # Claude API integration
│   ├── brevo-sync.js        # Brevo CRM sync
│   ├── email-sender.js      # Email transmission
│   └── notifications.js     # Alert system
├── config/                   # Configuration
│   ├── workflows.js         # Workflow templates
│   └── clients.js           # Multi-tenant configs
├── prompts/                  # AI prompts (bilingual)
│   ├── email-prompts.js     # Email analysis & generation
│   └── extraction-prompts.js # Document data extraction
└── data/                     # Data storage
    └── activity-log.js      # Activity tracking
```

### Data Flow

1. **Email Processing**
   - Incoming email → webhook
   - Claude analyzes intent/sentiment
   - Claude generates response draft
   - Draft stored for approval or auto-sent
   - Contact synced to Brevo CRM
   - Activity logged

2. **Document Processing**
   - Document uploaded with type
   - Claude extracts structured data
   - Output formatted (JSON/CSV/XML)
   - Contact info synced to CRM
   - Activity logged

3. **Workflow Execution**
   - Trigger received with data
   - Each step executed sequentially
   - Results passed to next step
   - Errors handled per step config
   - Completion notification sent

## Industry Verticals

### Pre-built Workflows

1. **Dental** - Patient inquiry → response → CRM sync
2. **Medical** - Appointment booking → confirmation → patient sync
3. **Legal** - Case intake → form distribution → matter creation
4. **Auto** - Vehicle inquiry → lead scoring → pipeline add
5. **Real Estate** - Property inquiry → details → prospect scoring
6. **Insurance** - Quote request → form → prospect creation
7. **Restaurant** - Reservation → confirmation → no-show tracking

## Prompts (Bilingual EN/ES)

All prompts support English and Spanish. Configured via `DEFAULT_RESPONSE_LANGUAGE` env var.

### Email Analysis Categories
- lead_inquiry - New potential customer
- support - Technical or service issue
- complaint - Negative feedback
- billing - Payment/invoice related
- spam - Unwanted email
- feedback - Product suggestions
- other - Miscellaneous

### Document Types Supported
- invoice - Financial invoice
- receipt - Transaction receipt
- contract - Legal agreement
- form - Any form document
- passport - Travel document
- business_card - Contact card
- medical_form - Healthcare form

## Multi-Tenant Features

### Client Plans
- **Starter** - 2k emails/mo, 500 docs/mo, 5 workflows
- **Professional** - 5k emails/mo, 2k docs/mo, 10 workflows
- **Enterprise** - 10k+ emails/mo, 5k+ docs/mo, unlimited workflows

### Client Management
```javascript
const clients = require('./config/clients');

// Get client
const client = clients.getClientById('dental-clinic-1');

// Check feature access
if (clients.hasFeature(clientId, 'multiLanguage')) { }

// Check usage limits
if (clients.hasExceededLimits(clientId, 'emails', count)) { }
```

## Activity Logging

All operations automatically logged:

```javascript
const activityLog = require('./data/activity-log');

// Get recent activity
const activity = activityLog.getRecentActivity(10);

// Get statistics
const stats = activityLog.getStats();

// Search logs
const results = activityLog.search('invoice');

// Export
const json = activityLog.exportAsJSON();
const csv = activityLog.exportAsCSV();
```

## Error Handling

- **Webhook signature validation** - Validates X-Webhook-Signature in production
- **Missing required fields** - 400 Bad Request
- **API key missing** - Gracefully degrades
- **Claude API errors** - Logged and returned
- **Workflow step errors** - Continues per config or stops
- **Brevo sync failures** - Logged but doesn't block email send

## Security

- Non-root Docker user
- Webhook signature validation
- Input validation on all endpoints
- API key configuration via environment
- CORS enabled
- Error messages don't leak sensitive data in production
- Health checks configured

## Production Checklist

- [ ] Set environment variables
- [ ] Enable webhook signature validation (NODE_ENV=production)
- [ ] Configure ANTHROPIC_API_KEY
- [ ] Configure BREVO_API_KEY
- [ ] Set WEBHOOK_SECRET
- [ ] Enable monitoring/logging
- [ ] Configure email forwarding to webhook URL
- [ ] Test email flow end-to-end
- [ ] Test document processing
- [ ] Test at least one workflow
- [ ] Monitor activity logs

## Testing

### Manual Testing

```bash
# Test email processing
curl -X POST http://localhost:3001/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "support@company.com",
    "subject": "Test inquiry",
    "body": "Testing the email system"
  }'

# View drafts
curl http://localhost:3001/api/drafts

# Get activity log
curl http://localhost:3001/api/activity
```

## Scaling Considerations

Currently uses:
- In-memory activity log (max 10k entries)
- In-memory email drafts
- In-memory workflow executions

For production scale, migrate to:
- Database for activity logs
- Redis for draft storage
- Database for workflow executions
- Message queue for async processing

## Future Enhancements

- SMS/WhatsApp integration
- Voice message responses
- Advanced ML-based lead scoring
- Sentiment-based routing
- Custom NLP model fine-tuning
- Real-time analytics dashboard
- Scheduled report generation
- A/B testing for email responses
- Conversation history context
- Multi-turn email conversations

## Support & Documentation

- API docs: Visit `http://localhost:3001/` for dashboard
- Health check: `http://localhost:3001/api/health`
- Issue tracking: (Add your tracking system)
- Support email: alex@bridgeaihq.com

## License

MIT

---

**Made with ❤️ by BridgeAI**
