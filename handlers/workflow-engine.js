const { v4: uuidv4 } = require('uuid');
const workflows = require('../config/workflows');
const claudeAI = require('../services/claude-ai');
const brevoSync = require('../services/brevo-sync');
const emailSender = require('../services/email-sender');
const activityLog = require('../data/activity-log');

// In-memory workflow execution history
const workflowExecutions = {};

/**
 * Trigger a workflow
 */
async function triggerWorkflow(req, res) {
  try {
    const {
      workflowId,
      industryVertical,
      triggerData,
      clientId
    } = req.body;

    if (!workflowId && !industryVertical) {
      return res.status(400).json({
        success: false,
        message: 'Either workflowId or industryVertical is required'
      });
    }

    const clientIdVal = clientId || process.env.CLIENT_ID || 'default';
    const executionId = uuidv4();

    // Get workflow configuration
    let workflow;
    if (workflowId) {
      workflow = workflows.getWorkflowById(workflowId);
    } else {
      workflow = workflows.getDefaultWorkflowForIndustry(industryVertical);
    }

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    activityLog.log({
      type: 'workflow_started',
      executionId,
      workflowId: workflow.id,
      industryVertical: workflow.industry,
      clientId: clientIdVal
    });

    // Execute workflow
    const execution = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'running',
      startedAt: new Date(),
      steps: [],
      clientId: clientIdVal,
      triggerData
    };

    workflowExecutions[executionId] = execution;

    // Execute each step
    const results = [];
    for (const step of workflow.steps) {
      try {
        const stepResult = await executeWorkflowStep(step, triggerData, clientIdVal);

        execution.steps.push({
          stepId: step.id,
          stepName: step.name,
          status: 'completed',
          result: stepResult
        });

        results.push(stepResult);
      } catch (stepError) {
        console.error(`Workflow step error in ${step.id}:`, stepError);

        execution.steps.push({
          stepId: step.id,
          stepName: step.name,
          status: 'failed',
          error: stepError.message
        });

        // Stop execution on error
        if (step.continueOnError !== true) {
          execution.status = 'failed';
          break;
        }
      }
    }

    execution.status = execution.steps.some(s => s.status === 'failed') ? 'failed' : 'completed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt - execution.startedAt;

    activityLog.log({
      type: 'workflow_completed',
      executionId,
      workflowId: workflow.id,
      status: execution.status,
      steps: execution.steps.length
    });

    res.json({
      success: true,
      message: 'Workflow executed',
      executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: execution.status,
      stepsCompleted: execution.steps.filter(s => s.status === 'completed').length,
      duration: `${execution.duration}ms`,
      steps: execution.steps
    });

  } catch (error) {
    console.error('Error in triggerWorkflow:', error);

    activityLog.log({
      type: 'error',
      message: `Workflow execution error: ${error.message}`
    });

    res.status(500).json({
      success: false,
      message: 'Error executing workflow',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Execute a single workflow step
 */
async function executeWorkflowStep(step, triggerData, clientId) {
  const stepStartTime = Date.now();

  switch (step.type) {
    case 'analyze_email':
      return await claudeAI.analyzeEmail({
        from: triggerData.from,
        to: triggerData.to,
        subject: triggerData.subject,
        body: triggerData.body,
        clientId
      });

    case 'categorize_lead':
      return await claudeAI.categorizeLead({
        name: triggerData.name,
        company: triggerData.company,
        email: triggerData.email,
        message: triggerData.message,
        clientId
      });

    case 'extract_data':
      return await claudeAI.extractDocumentData({
        content: triggerData.content,
        documentType: step.config?.documentType || 'invoice',
        clientId
      });

    case 'send_email':
      return await emailSender.sendResponse({
        to: triggerData.recipientEmail || step.config?.to,
        subject: triggerData.subject || step.config?.subject,
        body: triggerData.body || step.config?.body,
        clientId
      });

    case 'sync_crm':
      return await brevoSync.syncLeadFromEmail({
        from: triggerData.from || triggerData.email,
        subject: triggerData.subject,
        body: triggerData.body || triggerData.message,
        clientId
      });

    case 'generate_response':
      return await claudeAI.generateEmailResponse({
        email: {
          from: triggerData.from,
          to: triggerData.to,
          subject: triggerData.subject,
          body: triggerData.body
        },
        analysis: triggerData.analysis || {},
        clientId
      });

    case 'log_activity':
      return activityLog.log({
        type: 'workflow_activity',
        message: step.config?.message || 'Workflow step completed',
        data: triggerData
      });

    case 'wait':
      return new Promise(resolve => {
        const duration = step.config?.durationMs || 1000;
        setTimeout(() => resolve({ success: true, waited: duration }), duration);
      });

    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

/**
 * Get all available workflows
 */
function getWorkflows(req, res) {
  try {
    const allWorkflows = workflows.getAllWorkflows();

    const workflowList = allWorkflows.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      industry: w.industry,
      steps: w.steps.length,
      triggerType: w.triggerType
    }));

    res.json({
      success: true,
      total: workflowList.length,
      workflows: workflowList
    });
  } catch (error) {
    console.error('Error in getWorkflows:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving workflows'
    });
  }
}

/**
 * Get workflow execution status
 */
function getExecutionStatus(req, res) {
  try {
    const { executionId } = req.params;

    const execution = workflowExecutions[executionId];
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Execution not found'
      });
    }

    res.json({
      success: true,
      executionId: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflowName,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.duration,
      stepsCompleted: execution.steps.filter(s => s.status === 'completed').length,
      stepsFailed: execution.steps.filter(s => s.status === 'failed').length,
      steps: execution.steps
    });

  } catch (error) {
    console.error('Error in getExecutionStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving execution status'
    });
  }
}

module.exports = {
  triggerWorkflow,
  getWorkflows,
  getExecutionStatus
};
