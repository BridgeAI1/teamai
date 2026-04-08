/**
 * Pre-built workflow templates by industry
 */

const WORKFLOWS = {
  // Dental Practice Workflow
  'dental-lead-response': {
    id: 'dental-lead-response',
    name: 'Dental Practice - Lead Response',
    description: 'Automated response to new patient inquiries',
    industry: 'dental',
    triggerType: 'email',
    steps: [
      {
        id: 'analyze_inquiry',
        name: 'Analyze Inquiry',
        type: 'analyze_email',
        continueOnError: false
      },
      {
        id: 'categorize',
        name: 'Categorize Lead',
        type: 'categorize_lead',
        continueOnError: true
      },
      {
        id: 'generate_response',
        name: 'Generate Response',
        type: 'generate_response',
        continueOnError: false
      },
      {
        id: 'sync_crm',
        name: 'Sync to CRM',
        type: 'sync_crm',
        continueOnError: true
      }
    ]
  },

  // Medical/Healthcare Workflow
  'medical-appointment-booking': {
    id: 'medical-appointment-booking',
    name: 'Medical Practice - Appointment Booking',
    description: 'Process appointment requests and confirmations',
    industry: 'medical',
    triggerType: 'email',
    steps: [
      {
        id: 'analyze_request',
        name: 'Analyze Request',
        type: 'analyze_email',
        continueOnError: false
      },
      {
        id: 'generate_confirmation',
        name: 'Generate Confirmation',
        type: 'generate_response',
        continueOnError: false
      },
      {
        id: 'sync_patient',
        name: 'Sync Patient Data',
        type: 'sync_crm',
        continueOnError: true
      },
      {
        id: 'send_confirmation',
        name: 'Send Confirmation',
        type: 'send_email',
        config: {
          subject: 'Appointment Confirmation'
        },
        continueOnError: true
      }
    ]
  },

  // Legal Practice Workflow
  'law-firm-intake': {
    id: 'law-firm-intake',
    name: 'Law Firm - Client Intake',
    description: 'Process new client inquiries and document collection',
    industry: 'law',
    triggerType: 'email',
    steps: [
      {
        id: 'analyze_inquiry',
        name: 'Analyze Legal Inquiry',
        type: 'analyze_email',
        continueOnError: false
      },
      {
        id: 'categorize_case',
        name: 'Categorize Case Type',
        type: 'categorize_lead',
        continueOnError: true
      },
      {
        id: 'send_intake_form',
        name: 'Send Intake Form',
        type: 'send_email',
        config: {
          subject: 'Client Intake Form',
          body: 'Please complete the attached intake form'
        },
        continueOnError: false
      },
      {
        id: 'sync_matter',
        name: 'Create Matter in CRM',
        type: 'sync_crm',
        continueOnError: true
      }
    ]
  },

  // Auto Dealership Workflow
  'auto-sales-lead': {
    id: 'auto-sales-lead',
    name: 'Auto Dealership - Sales Lead',
    description: 'Qualify and respond to vehicle inquiries',
    industry: 'auto',
    triggerType: 'email',
    steps: [
      {
        id: 'analyze_inquiry',
        name: 'Analyze Inquiry',
        type: 'analyze_email',
        continueOnError: false
      },
      {
        id: 'score_lead',
        name: 'Score Lead Quality',
        type: 'categorize_lead',
        continueOnError: true
      },
      {
        id: 'generate_response',
        name: 'Generate Sales Response',
        type: 'generate_response',
        continueOnError: false
      },
      {
        id: 'sync_lead',
        name: 'Add to Sales Pipeline',
        type: 'sync_crm',
        continueOnError: true
      }
    ]
  },

  // Real Estate Workflow
  'real-estate-property-inquiry': {
    id: 'real-estate-property-inquiry',
    name: 'Real Estate - Property Inquiry',
    description: 'Handle property viewing requests and inquiries',
    industry: 'real_estate',
    triggerType: 'email',
    steps: [
      {
        id: 'analyze_inquiry',
        name: 'Analyze Property Interest',
        type: 'analyze_email',
        continueOnError: false
      },
      {
        id: 'send_property_details',
        name: 'Send Property Information',
        type: 'send_email',
        config: {
          subject: 'Property Details You Requested'
        },
        continueOnError: false
      },
      {
        id: 'qualify_buyer',
        name: 'Qualify Buyer',
        type: 'categorize_lead',
        continueOnError: true
      },
      {
        id: 'sync_prospect',
        name: 'Add to Prospects',
        type: 'sync_crm',
        continueOnError: true
      }
    ]
  },

  // Insurance Workflow
  'insurance-quote-request': {
    id: 'insurance-quote-request',
    name: 'Insurance - Quote Request',
    description: 'Process quote requests and policy inquiries',
    industry: 'insurance',
    triggerType: 'email',
    steps: [
      {
        id: 'analyze_inquiry',
        name: 'Analyze Quote Request',
        type: 'analyze_email',
        continueOnError: false
      },
      {
        id: 'send_quote_form',
        name: 'Send Quote Form',
        type: 'send_email',
        config: {
          subject: 'Your Insurance Quote'
        },
        continueOnError: false
      },
      {
        id: 'sync_prospect',
        name: 'Add to Prospects',
        type: 'sync_crm',
        continueOnError: true
      }
    ]
  },

  // Restaurant Workflow
  'restaurant-reservation': {
    id: 'restaurant-reservation',
    name: 'Restaurant - Reservation Request',
    description: 'Handle reservation inquiries and confirmations',
    industry: 'restaurant',
    triggerType: 'email',
    steps: [
      {
        id: 'analyze_request',
        name: 'Analyze Reservation Request',
        type: 'analyze_email',
        continueOnError: false
      },
      {
        id: 'generate_confirmation',
        name: 'Generate Confirmation',
        type: 'generate_response',
        continueOnError: false
      },
      {
        id: 'send_confirmation',
        name: 'Send Confirmation',
        type: 'send_email',
        config: {
          subject: 'Reservation Confirmed'
        },
        continueOnError: false
      }
    ]
  },

  // Document Processing Workflow
  'document-extraction': {
    id: 'document-extraction',
    name: 'Document Extraction & Processing',
    description: 'Extract data from documents and sync to CRM',
    industry: 'general',
    triggerType: 'document_upload',
    steps: [
      {
        id: 'extract_data',
        name: 'Extract Document Data',
        type: 'extract_data',
        config: { documentType: 'invoice' },
        continueOnError: false
      },
      {
        id: 'validate_data',
        name: 'Validate Extracted Data',
        type: 'log_activity',
        config: { message: 'Document data validated' },
        continueOnError: true
      },
      {
        id: 'sync_contact',
        name: 'Sync to CRM',
        type: 'sync_crm',
        continueOnError: true
      }
    ]
  },

  // Invoice Processing
  'invoice-processing': {
    id: 'invoice-processing',
    name: 'Invoice Processing',
    description: 'Extract invoice data and create billing records',
    industry: 'general',
    triggerType: 'document_upload',
    steps: [
      {
        id: 'extract_invoice',
        name: 'Extract Invoice Data',
        type: 'extract_data',
        config: { documentType: 'invoice' },
        continueOnError: false
      },
      {
        id: 'validate_invoice',
        name: 'Validate Invoice',
        type: 'log_activity',
        continueOnError: true
      }
    ]
  },

  // Lead Nurturing Campaign
  'lead-nurture-campaign': {
    id: 'lead-nurture-campaign',
    name: 'Lead Nurturing Campaign',
    description: 'Automatic follow-up sequence for new leads',
    industry: 'general',
    triggerType: 'lead_received',
    steps: [
      {
        id: 'score_lead',
        name: 'Score Lead Quality',
        type: 'categorize_lead',
        continueOnError: false
      },
      {
        id: 'send_welcome',
        name: 'Send Welcome Email',
        type: 'send_email',
        config: {
          subject: 'Welcome to Our Service'
        },
        continueOnError: false
      },
      {
        id: 'sync_lead',
        name: 'Add to Nurture Campaign',
        type: 'sync_crm',
        continueOnError: true
      },
      {
        id: 'schedule_followup',
        name: 'Schedule Follow-up',
        type: 'log_activity',
        config: { message: 'Follow-up scheduled for 3 days' },
        continueOnError: true
      }
    ]
  }
};

/**
 * Get all workflows
 */
function getAllWorkflows() {
  return Object.values(WORKFLOWS);
}

/**
 * Get workflow by ID
 */
function getWorkflowById(id) {
  return WORKFLOWS[id] || null;
}

/**
 * Get workflows by industry
 */
function getWorkflowsByIndustry(industry) {
  return Object.values(WORKFLOWS).filter(w => w.industry === industry);
}

/**
 * Get default workflow for industry
 */
function getDefaultWorkflowForIndustry(industry) {
  const industryWorkflows = getWorkflowsByIndustry(industry);
  return industryWorkflows.length > 0 ? industryWorkflows[0] : null;
}

/**
 * Create custom workflow
 */
function createWorkflow(id, name, description, industry, steps) {
  const workflow = {
    id,
    name,
    description,
    industry,
    triggerType: 'custom',
    steps
  };

  WORKFLOWS[id] = workflow;
  return workflow;
}

module.exports = {
  WORKFLOWS,
  getAllWorkflows,
  getWorkflowById,
  getWorkflowsByIndustry,
  getDefaultWorkflowForIndustry,
  createWorkflow
};
