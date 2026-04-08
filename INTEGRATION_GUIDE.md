# TeamAI Integration Guide

Complete guide for integrating TeamAI with your business systems and testing all features.

## Quick Integration Steps

### 1. Email Integration

**Option A: Gmail API**
```bash
# Create Gmail API credentials
# 1. Go to Google Cloud Console
# 2. Create new project
# 3. Enable Gmail API
# 4. Create service account with Gmail delegation
# 5. Use subject line to auto-forward:
#    Set Gmail filter: To: your-email@gmail.com
#    Forward to: webhook.teamai.your-domain.com/webhook/email
```

**Option B: Email Forwarding Rules**
```bash
# Create forwarding rule in your email provider
# Example: customer@yourdomain.com
# Forward to: https://your-teamai-server.com/webhook/email
# Add custom header X-Webhook-Signature for security
```

### 2. Brevo CRM Setup

```bash
# 1. Get API key from Brevo
# 2. Create a list (or use existing list ID)
# 3. Configure contacts with custom fields:
#    - FIRSTNAME (default)
#    - LASTNAME (default)
#    - COMPANY
#    - PHONE
#    - LEADINQUIRY
#    - SOURCE
#    - RECEIVED_AT
```

### 3. Claude API Setup

```bash
# 1. Create account at anthropic.com
# 2. Generate API key
# 3. Add to environment variables
# 4. Verify with health check: GET /api/health
```

### 4. Webhook Security

```bash
# Generate webhook signature (server side)
const crypto = require('crypto');
const payload = JSON.stringify(emailData);
const secret = process.env.WEBHOOK_SECRET;
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

# Send with header:
# X-Webhook-Signature: <signature>
```

## Testing All Features

### Test 1: Email Processing

```bash
# 1. Send test email via webhook
curl -X POST http://localhost:3001/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "john.doe@example.com",
    "to": "support@company.com",
    "subject": "I am interested in your dental services",
    "body": "I have been having tooth pain and would like to schedule an appointment. Can you help?",
    "client_id": "default"
  }'

# Response should include draft response and category analysis

# 2. Check draft
curl http://localhost:3001/api/drafts

# 3. Approve and send
curl -X POST http://localhost:3001/api/drafts/{id}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "customResponse": ""
  }'

# 4. View activity
curl http://localhost:3001/api/activity
```

### Test 2: Document Processing

```bash
# 1. Convert document to base64
base64 < invoice.pdf > invoice.b64

# 2. Process document
INVOICE_BASE64=$(cat invoice.b64)

curl -X POST http://localhost:3001/api/process-document \
  -H "Content-Type: application/json" \
  -d "{
    \"documentContent\": \"$INVOICE_BASE64\",
    \"documentType\": \"invoice\",
    \"documentFormat\": \"base64\",
    \"outputFormat\": \"json\",
    \"language\": \"en\"
  }"

# 3. Check extracted data
# Response includes all extracted fields

# 4. Verify CRM sync
# Check Brevo for new contact with extracted email
```

### Test 3: Workflow Execution

```bash
# 1. Get available workflows
curl http://localhost:3001/api/workflows

# 2. Trigger workflow
curl -X POST http://localhost:3001/api/workflow/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "dental-lead-response",
    "triggerData": {
      "from": "patient@example.com",
      "to": "clinic@dentist.com",
      "subject": "Can I get an emergency appointment?",
      "body": "I have severe tooth pain and need to be seen today"
    }
  }'

# Response shows workflow execution status and steps
```

### Test 4: Multi-Language Support

```bash
# Test Spanish email processing
curl -X POST http://localhost:3001/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "cliente@ejemplo.com",
    "to": "soporte@empresa.com",
    "subject": "Interesado en sus servicios",
    "body": "Me gustaría conocer más sobre sus servicios de consultoría",
    "client_id": "default"
  }'

# Set environment variable for response language
# DEFAULT_RESPONSE_LANGUAGE=es
```

### Test 5: Different Document Types

```bash
# Test invoice extraction
curl -X POST http://localhost:3001/api/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "base64-encoded-invoice",
    "documentType": "invoice",
    "outputFormat": "csv"
  }'

# Test contract extraction
curl -X POST http://localhost:3001/api/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "base64-encoded-contract",
    "documentType": "contract",
    "outputFormat": "xml"
  }'

# Test medical form
curl -X POST http://localhost:3001/api/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "base64-encoded-form",
    "documentType": "medical_form",
    "outputFormat": "json"
  }'
```

### Test 6: Different Industry Workflows

```bash
# Test legal firm intake
curl -X POST http://localhost:3001/api/workflow/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "law-firm-intake",
    "triggerData": {
      "from": "client@example.com",
      "to": "intake@law.com",
      "subject": "Personal injury case consultation",
      "body": "I was injured in a car accident and need legal representation"
    }
  }'

# Test auto dealership lead
curl -X POST http://localhost:3001/api/workflow/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "auto-sales-lead",
    "triggerData": {
      "from": "buyer@example.com",
      "to": "sales@dealer.com",
      "subject": "Interested in 2024 Tesla Model 3",
      "body": "Do you have this vehicle in stock? What are the available colors?"
    }
  }'

# Test restaurant reservation
curl -X POST http://localhost:3001/api/workflow/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "restaurant-reservation",
    "triggerData": {
      "from": "diner@example.com",
      "to": "reservations@restaurant.com",
      "subject": "Reservation for 4 people",
      "body": "I would like to make a reservation for 4 people on Saturday at 7pm"
    }
  }'
```

### Test 7: Client Multi-Tenancy

```bash
# Test with different client
curl -X POST http://localhost:3001/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "patient@example.com",
    "to": "support@clinic.com",
    "subject": "Appointment request",
    "body": "I need to schedule a checkup",
    "client_id": "dental-clinic-1"
  }'

# Each client can have different configurations
# Check config/clients.js for available clients
```

### Test 8: Error Handling

```bash
# Test missing required fields
curl -X POST http://localhost:3001/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com"
    # Missing: to, subject, body
  }'

# Response: 400 Bad Request

# Test invalid workflow
curl -X POST http://localhost:3001/api/workflow/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "nonexistent-workflow"
  }'

# Response: 404 Not Found

# Test invalid document type (should default gracefully)
curl -X POST http://localhost:3001/api/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "some-content",
    "documentType": "unknown_type"
  }'

# Response: Uses default extraction template
```

### Test 9: Draft Approval Workflow

```bash
# 1. Receive email and get draft
curl -X POST http://localhost:3001/webhook/email \
  -H "Content-Type: application/json" \
  -d '{...}' > response.json

# Extract draft ID from response

# 2. Review draft
curl http://localhost:3001/api/drafts

# 3. Approve as-is
curl -X POST http://localhost:3001/api/drafts/{id}/approve \
  -H "Content-Type: application/json" \
  -d '{}'

# 4. Or approve with custom response
curl -X POST http://localhost:3001/api/drafts/{id}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "customResponse": "Thank you for your interest. I will contact you tomorrow."
  }'

# 5. Or reject with reason
curl -X POST http://localhost:3001/api/drafts/{id}/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Response needs more personalization"
  }'
```

## Integration Scenarios

### Scenario 1: Dental Practice

```bash
# Patient sends inquiry
# 1. Email arrives
# 2. Analyzed and categorized as appointment_request
# 3. Response generated with next available time
# 4. Draft reviewed by receptionist
# 5. Approved and sent
# 6. Patient contact added to Brevo
# 7. Marked as follow-up in 7 days
```

### Scenario 2: Legal Firm

```bash
# Potential client inquires
# 1. Email arrives
# 2. Analyzed for case type
# 3. Intake form generated and sent
# 4. Forms received and auto-processed
# 5. Data extracted and validated
# 6. Matter created in CRM
# 7. Attorney notified
```

### Scenario 3: Auto Dealership

```bash
# Customer asks about vehicle
# 1. Email arrives
# 2. Lead quality assessed
# 3. Response generated with options
# 4. Added to sales pipeline in CRM
# 5. Sales person notified if hot lead
# 6. Follow-up scheduled in 3 days
```

## Monitoring & Analytics

### View Dashboard

```bash
# Open in browser
http://localhost:3001/

# Shows real-time system status, stats, and recent activity
```

### Get Statistics

```bash
curl http://localhost:3001/api/activity | jq '.stats'

# Returns:
# - emailsProcessed
# - documentsProcessed
# - workflowsExecuted
# - workflowsFailed
# - errors
# - by24Hours
```

### Export Activity Logs

```bash
# Get JSON export
curl http://localhost:3001/api/activity > activity.json

# Analyze in spreadsheet
node -e "
const logs = require('./data/activity-log');
console.log(logs.exportAsCSV());
" > activity.csv
```

## Troubleshooting

### Email Not Received

```bash
# 1. Check webhook endpoint is accessible
curl http://localhost:3001/api/health

# 2. Verify signature is correct (if required)
# 3. Check activity log for errors
curl http://localhost:3001/api/activity | grep error

# 4. Verify ANTHROPIC_API_KEY is set
env | grep ANTHROPIC
```

### Claude API Errors

```bash
# Check if API key is valid
# Test directly: node -e "
const claude = require('./services/claude-ai');
claude.callClaude('Test', 'test').catch(e => console.error(e.message));
"

# Common errors:
# - "Invalid API key" - Check ANTHROPIC_API_KEY
# - "Rate limited" - Wait and retry
# - "No content in response" - Check prompt formatting
```

### Brevo Sync Not Working

```bash
# 1. Verify API key
env | grep BREVO

# 2. Check list ID exists
curl -X GET https://api.brevo.com/v3/contacts/lists/9 \
  -H "api-key: $BREVO_API_KEY"

# 3. Monitor sync attempts in activity log
curl http://localhost:3001/api/activity | grep brevo
```

### Workflow Not Triggering

```bash
# 1. Verify workflow exists
curl http://localhost:3001/api/workflows

# 2. Check workflow syntax
node -e "
const wf = require('./config/workflows');
console.log(JSON.stringify(wf.getWorkflowById('dental-lead-response'), null, 2));
"

# 3. Check trigger data matches expected format
# Each workflow step has specific data requirements
```

## Performance Tips

1. **Batch Document Processing** - Process multiple documents in sequence
2. **Async Notifications** - Send notifications asynchronously
3. **Cache Workflows** - Workflows are cached by default
4. **Monitor Memory** - In-memory log has max 10k entries
5. **Use Webhooks** - Real-time better than polling

## Security Best Practices

1. **Validate Webhooks** - Always validate signature in production
2. **Use HTTPS** - Never send webhooks over HTTP
3. **Rotate Keys** - Regularly rotate API keys
4. **Limit Access** - Use VPC/IP allowlist for production
5. **Monitor Logs** - Review activity logs for anomalies
6. **Rate Limiting** - Add rate limiting for production
7. **Input Validation** - Validate all incoming data

## Cost Optimization

- **Claude API** - Uses sonnet-3.5 (balanced cost/quality)
- **Batch Processing** - Group emails to reduce API calls
- **Caching** - Workflow templates cached in memory
- **Selective CRM Sync** - Only sync when necessary

---

For support, contact: alex@bridgeaihq.com
