/**
 * Multi-tenant client configurations
 */

const CLIENTS = {
  'default': {
    id: 'default',
    name: 'BridgeAI HQ',
    email: 'alex@bridgeaihq.com',
    industry: 'ai_services',
    status: 'active',
    plan: 'enterprise',
    createdAt: new Date('2024-01-01'),
    maxMonthlyEmails: 10000,
    maxMonthlyDocuments: 5000,
    maxWorkflows: 50,
    languages: ['en', 'es'],
    features: {
      emailResponder: true,
      documentProcessing: true,
      workflowAutomation: true,
      crmSync: true,
      multiLanguage: true,
      customization: true,
      apiAccess: true,
      webhooks: true
    }
  },

  'dental-clinic-1': {
    id: 'dental-clinic-1',
    name: 'Bright Smile Dental',
    email: 'admin@brightsmile.local',
    industry: 'dental',
    status: 'active',
    plan: 'professional',
    createdAt: new Date('2024-02-15'),
    maxMonthlyEmails: 5000,
    maxMonthlyDocuments: 2000,
    maxWorkflows: 10,
    languages: ['en'],
    features: {
      emailResponder: true,
      documentProcessing: true,
      workflowAutomation: true,
      crmSync: true,
      multiLanguage: false,
      customization: true,
      apiAccess: false,
      webhooks: true
    },
    defaultWorkflow: 'dental-lead-response'
  },

  'law-firm-1': {
    id: 'law-firm-1',
    name: 'Legal Associates LLC',
    email: 'intake@legalassoc.local',
    industry: 'law',
    status: 'active',
    plan: 'professional',
    createdAt: new Date('2024-03-01'),
    maxMonthlyEmails: 3000,
    maxMonthlyDocuments: 5000,
    maxWorkflows: 15,
    languages: ['en', 'es'],
    features: {
      emailResponder: true,
      documentProcessing: true,
      workflowAutomation: true,
      crmSync: true,
      multiLanguage: true,
      customization: true,
      apiAccess: true,
      webhooks: true
    },
    defaultWorkflow: 'law-firm-intake'
  },

  'real-estate-1': {
    id: 'real-estate-1',
    name: 'Urban Properties Realty',
    email: 'leads@urbanprop.local',
    industry: 'real_estate',
    status: 'active',
    plan: 'professional',
    createdAt: new Date('2024-02-20'),
    maxMonthlyEmails: 8000,
    maxMonthlyDocuments: 3000,
    maxWorkflows: 12,
    languages: ['en', 'es'],
    features: {
      emailResponder: true,
      documentProcessing: true,
      workflowAutomation: true,
      crmSync: true,
      multiLanguage: true,
      customization: true,
      apiAccess: true,
      webhooks: true
    },
    defaultWorkflow: 'real-estate-property-inquiry'
  },

  'auto-dealer-1': {
    id: 'auto-dealer-1',
    name: 'Premier Auto Sales',
    email: 'sales@premierdealers.local',
    industry: 'auto',
    status: 'active',
    plan: 'professional',
    createdAt: new Date('2024-03-10'),
    maxMonthlyEmails: 6000,
    maxMonthlyDocuments: 2000,
    maxWorkflows: 10,
    languages: ['en'],
    features: {
      emailResponder: true,
      documentProcessing: true,
      workflowAutomation: true,
      crmSync: true,
      multiLanguage: false,
      customization: true,
      apiAccess: false,
      webhooks: true
    },
    defaultWorkflow: 'auto-sales-lead'
  },

  'restaurant-1': {
    id: 'restaurant-1',
    name: 'The Gourmet Table',
    email: 'reservations@gourmet.local',
    industry: 'restaurant',
    status: 'active',
    plan: 'starter',
    createdAt: new Date('2024-03-15'),
    maxMonthlyEmails: 2000,
    maxMonthlyDocuments: 500,
    maxWorkflows: 5,
    languages: ['en', 'es'],
    features: {
      emailResponder: true,
      documentProcessing: false,
      workflowAutomation: true,
      crmSync: true,
      multiLanguage: true,
      customization: false,
      apiAccess: false,
      webhooks: true
    },
    defaultWorkflow: 'restaurant-reservation'
  }
};

/**
 * Get client by ID
 */
function getClientById(id) {
  return CLIENTS[id] || CLIENTS['default'];
}

/**
 * Get all clients
 */
function getAllClients() {
  return Object.values(CLIENTS);
}

/**
 * Get clients by status
 */
function getClientsByStatus(status) {
  return Object.values(CLIENTS).filter(c => c.status === status);
}

/**
 * Get clients by industry
 */
function getClientsByIndustry(industry) {
  return Object.values(CLIENTS).filter(c => c.industry === industry);
}

/**
 * Check if client has feature
 */
function hasFeature(clientId, featureName) {
  const client = getClientById(clientId);
  return client.features[featureName] || false;
}

/**
 * Check if client has exceeded limits
 */
function hasExceededLimits(clientId, metric, count) {
  const client = getClientById(clientId);

  switch (metric) {
    case 'emails':
      return count > client.maxMonthlyEmails;
    case 'documents':
      return count > client.maxMonthlyDocuments;
    case 'workflows':
      return count > client.maxWorkflows;
    default:
      return false;
  }
}

/**
 * Get client usage limits
 */
function getClientLimits(clientId) {
  const client = getClientById(clientId);
  return {
    maxMonthlyEmails: client.maxMonthlyEmails,
    maxMonthlyDocuments: client.maxMonthlyDocuments,
    maxWorkflows: client.maxWorkflows
  };
}

/**
 * Create new client
 */
function createClient(clientData) {
  const id = clientData.id || `client-${Date.now()}`;

  const client = {
    id,
    name: clientData.name,
    email: clientData.email,
    industry: clientData.industry || 'general',
    status: 'active',
    plan: clientData.plan || 'starter',
    createdAt: new Date(),
    maxMonthlyEmails: clientData.maxMonthlyEmails || 1000,
    maxMonthlyDocuments: clientData.maxMonthlyDocuments || 500,
    maxWorkflows: clientData.maxWorkflows || 5,
    languages: clientData.languages || ['en'],
    features: clientData.features || {
      emailResponder: true,
      documentProcessing: true,
      workflowAutomation: true,
      crmSync: true,
      multiLanguage: false,
      customization: false,
      apiAccess: false,
      webhooks: true
    },
    defaultWorkflow: clientData.defaultWorkflow || null
  };

  CLIENTS[id] = client;
  return client;
}

/**
 * Update client
 */
function updateClient(clientId, updates) {
  const client = CLIENTS[clientId];
  if (!client) {
    return null;
  }

  Object.assign(client, updates);
  return client;
}

/**
 * Deactivate client
 */
function deactivateClient(clientId) {
  const client = CLIENTS[clientId];
  if (client) {
    client.status = 'inactive';
    client.deactivatedAt = new Date();
  }
  return client;
}

module.exports = {
  CLIENTS,
  getClientById,
  getAllClients,
  getClientsByStatus,
  getClientsByIndustry,
  hasFeature,
  hasExceededLimits,
  getClientLimits,
  createClient,
  updateClient,
  deactivateClient
};
