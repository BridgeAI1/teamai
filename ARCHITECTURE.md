# TeamAI Architecture Documentation

## System Overview

TeamAI is a cloud-ready Node.js microservice that leverages Claude AI and Brevo CRM to automate business workflows. It operates as one of three core BridgeAI products (alongside VoiceIQ).

```
┌─────────────────────────────────────────────────────────┐
│                    Incoming Triggers                     │
├─────────────────────────────────────────────────────────┤
│  Email Webhook  │  Document Upload  │  Manual Trigger   │
└────────┬────────────────────┬─────────────────┬─────────┘
         │                    │                 │
         v                    v                 v
    ┌────────────────────────────────────────────────┐
    │         TeamAI HTTP Server (Express)           │
    │  Port: 3001  |  Framework: Express.js         │
    └────────────────────────────────────────────────┘
         │                    │                 │
         v                    v                 v
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Email       │  │  Document    │  │  Workflow    │
    │  Webhook     │  │  Processor   │  │  Engine      │
    │  Handler     │  │  Handler     │  │  Handler     │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────v────────┐
                    │   Claude AI     │
                    │   API Service   │
                    │ (Anthropic)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        v                    v                    v
    ┌────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Email    │  │    Brevo     │  │   Activity   │
    │   Sender   │  │  CRM Sync    │  │     Log      │
    │  (Brevo)   │  │  (Brevo API) │  │  (In-Memory) │
    └────────────┘  └──────────────┘  └──────────────┘
```

## Component Architecture

### 1. HTTP Server (server.js)
**Purpose**: Main Express.js application server
**Responsibilities**:
- Listen on PORT (default 3001)
- Route incoming requests to handlers
- CORS configuration
- Global error handling
- Health checks

**Key Routes**:
```
GET  /                      → Status dashboard
GET  /api/health            → Health check
POST /webhook/email         → Email handler
POST /api/process-document  → Document handler
POST /api/workflow/trigger  → Workflow handler
GET  /api/drafts            → Get pending drafts
POST /api/drafts/:id/*      → Draft actions
GET  /api/activity          → Activity logs
```

### 2. Request Handlers (handlers/)

#### Email Webhook Handler
**File**: `handlers/email-webhook.js`
**Inputs**: Email metadata (from, to, subject, body)
**Process**:
1. Validate webhook signature
2. Call Claude AI to analyze email
3. Generate draft response
4. Store draft for approval
5. Sync contact to CRM if applicable
6. Log activity

**Outputs**: Draft email response, analysis, action items

#### Document Processor Handler
**File**: `handlers/document-processor.js`
**Inputs**: Base64-encoded document + metadata
**Process**:
1. Decode document
2. Identify document type
3. Call Claude AI to extract data
4. Format output (JSON/CSV/XML)
5. Sync extracted contacts to CRM
6. Log activity

**Outputs**: Structured extracted data in requested format

#### Workflow Engine Handler
**File**: `handlers/workflow-engine.js`
**Inputs**: Workflow ID + trigger data
**Process**:
1. Load workflow configuration
2. Execute each step sequentially
3. Pass results to next step
4. Handle errors per step config
5. Log completion
6. Send notification

**Outputs**: Workflow execution status and results

#### Status Handler
**File**: `handlers/status.js`
**Purpose**: Dashboard and health monitoring
**Outputs**: 
- Beautiful HTML dashboard with system metrics
- JSON health status with API configuration

### 3. Services (services/)

#### Claude AI Service
**File**: `services/claude-ai.js`
**Functions**:
- `analyzeEmail()` - Intent, sentiment, urgency analysis
- `generateEmailResponse()` - Create appropriate responses
- `extractDocumentData()` - Parse documents for info
- `categorizeLead()` - Qualify leads
- `summarizeContent()` - Condense text
- `validateData()` - Check data quality

**Claude Model**: claude-3-5-sonnet-20241022

#### Brevo Sync Service
**File**: `services/brevo-sync.js`
**Functions**:
- `syncLeadFromEmail()` - Add email sender as contact
- `syncContactFromDocument()` - Add document contacts
- `sendTransactionalEmail()` - Send via Brevo
- `batchSyncContacts()` - Bulk import
- `getListSubscribers()` - Query contacts

**API**: https://api.brevo.com/v3

#### Email Sender Service
**File**: `services/email-sender.js`
**Functions**:
- `sendResponse()` - Send approved email
- `sendBulkEmails()` - Send to multiple recipients
- `sendTemplatedEmail()` - Use Brevo templates
- `sendNotification()` - Alert business owner

#### Notifications Service
**File**: `services/notifications.js`
**Functions**:
- `sendNotification()` - Generic notification
- `sendAlert()` - System alerts
- `sendLeadNotification()` - New lead alert
- `sendWorkflowNotification()` - Workflow completion

### 4. Configuration (config/)

#### Workflows Configuration
**File**: `config/workflows.js`
**Contains**: 10+ pre-built workflow templates
**Workflow Structure**:
```javascript
{
  id: string,
  name: string,
  industry: string,
  triggerType: string,
  steps: [
    {
      id: string,
      name: string,
      type: 'analyze_email' | 'extract_data' | 'send_email' | etc,
      config: object,
      continueOnError: boolean
    }
  ]
}
```

#### Clients Configuration
**File**: `config/clients.js`
**Contains**: Multi-tenant client definitions
**Client Structure**:
```javascript
{
  id: string,
  name: string,
  industry: string,
  plan: 'starter' | 'professional' | 'enterprise',
  maxMonthlyEmails: number,
  maxMonthlyDocuments: number,
  maxWorkflows: number,
  features: {
    emailResponder: boolean,
    documentProcessing: boolean,
    workflowAutomation: boolean,
    crmSync: boolean,
    multiLanguage: boolean,
    customization: boolean,
    apiAccess: boolean,
    webhooks: boolean
  }
}
```

### 5. Prompts (prompts/)

#### Email Prompts
**File**: `prompts/email-prompts.js`
**Contains**: Bilingual email analysis and response generation prompts
**Languages**: English, Spanish
**Categories**: 7 email types with specific response strategies

#### Extraction Prompts
**File**: `prompts/extraction-prompts.js`
**Contains**: Specialized extraction prompts for 8+ document types
**Languages**: English, Spanish
**Supported Types**: invoice, receipt, contract, form, passport, business_card, medical_form

### 6. Data Storage (data/)

#### Activity Log
**File**: `data/activity-log.js`
**Storage**: In-memory array (JavaScript)
**Max Entries**: 10,000 (auto-purges oldest)
**Operations**:
- `log()` - Add activity entry
- `getActivity()` - Retrieve logs
- `getStats()` - Generate statistics
- `exportAsJSON()` / `exportAsCSV()` - Export logs
- `search()` - Query logs

## Data Flow Diagrams

### Email Processing Flow

```
Email Arrives
     │
     v
Webhook Validation
     │
     v
Create Activity Log Entry
     │
     v
Call Claude AI
├─ Analyze Intent
├─ Detect Sentiment
└─ Assess Urgency
     │
     v
Extract Sender Email/Name
     │
     v
Generate Response Draft
     │
     v
Store Draft + Analysis
     │
     v
[APPROVAL WORKFLOW]
     │
     ├─ Check: Auto-response enabled?
     │  ├─ YES: Auto-send
     │  └─ NO: Wait for approval
     │
     v
Send Email (via Brevo)
     │
     v
Extract Contact Info
     │
     v
Sync to Brevo CRM
     │
     v
Log Success/Completion
```

### Document Processing Flow

```
Document Upload
     │
     v
Decode Base64
     │
     v
Validate Document Type
     │
     v
Load Appropriate Prompt
     │
     v
Call Claude AI
├─ Extract Fields
├─ Parse Values
└─ Format Output
     │
     v
Format Result
├─ JSON
├─ CSV
└─ XML
     │
     v
Extract Contacts
     │
     v
Sync to Brevo
     │
     v
Return Results + Metadata
```

### Workflow Execution Flow

```
Trigger Received
     │
     v
Load Workflow Config
     │
     v
Initialize Execution Record
     │
     v
For Each Step:
├─ Execute Action
├─ Capture Results
├─ Log Step Status
└─ Pass to Next Step
     │
     v
Error Handling:
├─ If continueOnError: Skip & continue
├─ Else: Stop execution
└─ Log error
     │
     v
Mark Complete/Failed
     │
     v
Send Notification (optional)
     │
     v
Return Results
```

## API Contract Examples

### Email Webhook Request
```json
{
  "from": "customer@example.com",
  "to": "support@company.com",
  "subject": "Inquiry about pricing",
  "body": "I would like to know about your pricing plans",
  "html": "<p>Optional HTML version</p>",
  "client_id": "default"
}
```

### Email Webhook Response
```json
{
  "success": true,
  "message": "Email analyzed, draft created...",
  "emailId": "uuid",
  "status": "pending_approval",
  "analysis": {
    "category": "lead_inquiry",
    "sentiment": "neutral",
    "urgency": "medium",
    "intent": "Pricing information request",
    "requiresHuman": false
  },
  "draftResponse": "Thank you for your inquiry..."
}
```

### Document Processing Request
```json
{
  "documentContent": "base64-encoded-content",
  "documentType": "invoice",
  "documentFormat": "base64",
  "outputFormat": "json",
  "language": "en",
  "client_id": "default"
}
```

### Document Processing Response
```json
{
  "success": true,
  "docId": "uuid",
  "documentType": "invoice",
  "extractedData": {
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-04-07",
    "vendor_name": "Acme Corp",
    "total_amount": "1500.00"
  },
  "formattedOutput": "JSON string of extracted data",
  "fieldsExtracted": 12
}
```

## Deployment Architecture

### Local Development
```
Developer Machine
└── Node.js 18+
    └── npm
        └── TeamAI Server (localhost:3001)
            ├── Environment: development
            └── Storage: In-memory
```

### Docker Container
```
Docker Image
└── Node.js 18-alpine
    ├── Dependencies (npm ci)
    ├── Application Code
    └── Non-root User (nodejs:nodejs)
```

### Railway Deployment
```
Railway Project
├── Docker Build
│   └── Builds from Dockerfile
├── Health Checks
│   ├── Interval: 30s
│   ├── Timeout: 10s
│   └── Retries: 3
├── Environment Variables
│   ├── Loaded from Railway Dashboard
│   └── Secrets encrypted
└── Auto-restart
    └── Max retries: 5
```

## Security Architecture

### Authentication
- **API Keys**: Environment variables (ANTHROPIC_API_KEY, BREVO_API_KEY)
- **Webhook Signature**: HMAC-SHA256 validation (production)
- **No user authentication**: B2B service (API consumers handle auth)

### Data Protection
- **HTTPS only**: In production
- **Input validation**: All endpoints validate input
- **Error handling**: No sensitive data in error messages
- **Logging**: Activity logs don't contain secrets

### API Security
```
┌─────────────────────────────────┐
│  Incoming Request               │
└────────────┬────────────────────┘
             │
             v
   ┌─────────────────────┐
   │ CORS Check          │ ✓ Enabled
   └────────────┬────────┘
                │
                v
   ┌─────────────────────┐
   │ Content-Type Check  │ ✓ JSON only
   └────────────┬────────┘
                │
                v
   ┌──────────────────────────┐
   │ Webhook Signature Valid? │ ✓ HMAC-SHA256
   │ (if NODE_ENV=production) │
   └────────────┬─────────────┘
                │
                v
   ┌──────────────────────────┐
   │ Required Fields Present? │ ✓ Validation
   └────────────┬─────────────┘
                │
                v
   ┌──────────────────────────┐
   │ API Key Valid?           │ ✓ Configured
   └────────────┬─────────────┘
                │
                v
           ✓ Proceed
```

## Scalability Considerations

### Current Limitations
- **In-memory storage**: Activity log max 10k entries
- **Single-process**: Single Node.js process
- **No database**: No persistent storage
- **Synchronous**: No job queue/async processing

### Scaling Path (Future)
1. **Add Database**
   - PostgreSQL for activity logs
   - Redis for draft storage
   - MongoDB for workflow history

2. **Message Queue**
   - RabbitMQ or AWS SQS
   - Async email sending
   - Batch document processing
   - Scheduled workflows

3. **Horizontal Scaling**
   - Load balancer (nginx/HAProxy)
   - Multiple Node.js instances
   - Shared database
   - Shared cache (Redis)

4. **Cloud Native**
   - Kubernetes deployment
   - Auto-scaling groups
   - Cloud storage (S3)
   - Managed services (RDS, ElastiCache)

## Performance Optimization

### Caching
- Workflow templates cached in memory
- Client configs cached
- Prompt templates cached

### Rate Limiting
- Not implemented (add for production)
- Recommendation: 100 req/min per client

### Database Indexes (Future)
- activity_log(client_id, timestamp)
- drafts(client_id, status)
- workflows(industry, id)

### Query Optimization
- Activity log: max 100 entries per request
- Paginate all list endpoints
- Use filtering (type, date range, client)

## Monitoring & Observability

### Health Checks
```
GET /api/health
{
  "status": "healthy",
  "configured": {
    "anthropic": true,
    "brevo": true,
    "webhook_secret": true
  }
}
```

### Metrics Collected
- Emails processed (24h, monthly, all-time)
- Documents processed (24h, monthly, all-time)
- Workflows executed (success/failed)
- API errors
- Response times (future)

### Logging
- Activity log (in-memory)
- Console logs (development)
- Structured logs (production - add JSON logging)

### Dashboard
- Beautiful HTML dashboard at `/`
- Real-time system status
- Recent activity feed
- Statistics by operation type

## Testing Strategy

### Unit Tests (Recommended)
```
tests/
├── services/
│   ├── claude-ai.test.js
│   ├── brevo-sync.test.js
│   └── email-sender.test.js
├── handlers/
│   ├── email-webhook.test.js
│   └── document-processor.test.js
└── config/
    └── workflows.test.js
```

### Integration Tests
```
POST /webhook/email → /api/drafts → /api/drafts/:id/approve
POST /api/process-document → Check Brevo sync
POST /api/workflow/trigger → Check all steps
```

### Load Testing
```
# Using autocannon or k6
- 100 concurrent email webhooks
- 50 concurrent document uploads
- 25 concurrent workflow triggers
```

## Disaster Recovery

### Data Loss
- **Activity logs**: Recreate from Brevo/email send logs
- **Drafts**: Lost (should approve immediately)
- **Workflows**: Configuration stored, can restart

### Service Down
- **Recovery**: Auto-restart via Railway
- **Health check**: Validates API keys
- **Webhook retry**: Depends on sender (Gmail, etc)

### API Failures
- **Claude API**: Graceful degradation, retry logic
- **Brevo API**: Non-blocking (logs error but continues)
- **Email send**: Fails visibly, needs retry

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Maintainer**: BridgeAI Engineering
