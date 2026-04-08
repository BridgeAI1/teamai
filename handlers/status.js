const activityLog = require('../data/activity-log');

/**
 * Get health status
 */
function getHealth(req, res) {
  try {
    const hasApiKeys = !!(process.env.ANTHROPIC_API_KEY && process.env.BREVO_API_KEY);

    res.json({
      success: true,
      service: 'TeamAI',
      status: hasApiKeys ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      configured: {
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        brevo: !!process.env.BREVO_API_KEY,
        webhook_secret: !!process.env.WEBHOOK_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
}

/**
 * Get HTML dashboard
 */
function getDashboard(req, res) {
  try {
    const recentActivity = activityLog.getRecentActivity(10);
    const stats = activityLog.getStats();

    const html = generateDashboardHTML({
      businessName: process.env.BUSINESS_NAME || 'BridgeAI',
      businessEmail: process.env.BUSINESS_EMAIL || 'not configured',
      industry: process.env.BUSINESS_INDUSTRY || 'ai_services',
      environment: process.env.NODE_ENV || 'development',
      hasApiKeys: !!(process.env.ANTHROPIC_API_KEY && process.env.BREVO_API_KEY),
      apiConfigured: !!process.env.ANTHROPIC_API_KEY,
      brevoConfigured: !!process.env.BREVO_API_KEY,
      recentActivity,
      stats
    });

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
}

/**
 * Generate HTML dashboard
 */
function generateDashboardHTML(data) {
  const statusColor = data.hasApiKeys ? '#22c55e' : '#ef4444';
  const statusText = data.hasApiKeys ? 'Operational' : 'Degraded';

  const activityHTML = data.recentActivity.map(log => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        ${new Date(log.timestamp).toLocaleTimeString()}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">
        ${log.type}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
        ${log.message || ''}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TeamAI Dashboard</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
          color: #111827;
          font-size: 32px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header .status {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${statusColor};
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .header p {
          color: #6b7280;
          font-size: 14px;
          margin-top: 10px;
        }
        .status-text {
          display: inline-block;
          padding: 4px 12px;
          background: ${statusColor}20;
          color: ${statusColor};
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          margin-left: 10px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .card h3 {
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .card .value {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .card .label {
          color: #9ca3af;
          font-size: 13px;
        }
        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .config-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 13px;
        }
        .config-item .indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${data.hasApiKeys ? '#22c55e' : '#ef4444'};
        }
        .config-item .label {
          color: #374151;
          flex: 1;
        }
        .activity-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .activity-section h2 {
          color: #111827;
          font-size: 18px;
          margin-bottom: 20px;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .api-endpoints {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          margin-top: 30px;
        }
        .api-endpoints h2 {
          color: #111827;
          font-size: 18px;
          margin-bottom: 20px;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 15px;
        }
        .endpoint {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        .endpoint:last-child {
          border-bottom: none;
        }
        .endpoint-method {
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 11px;
        }
        .method-get {
          background: #dbeafe;
          color: #0369a1;
        }
        .method-post {
          background: #dcfce7;
          color: #15803d;
        }
        .endpoint-path {
          color: #374151;
          font-family: 'Courier New', monospace;
        }
        .footer {
          text-align: center;
          color: white;
          font-size: 12px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>
            <span class="status"></span>
            TeamAI Dashboard
            <span class="status-text">${statusText}</span>
          </h1>
          <p>AI Employees Service for BridgeAI</p>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Business Name</h3>
            <div class="value" style="font-size: 18px;">${data.businessName}</div>
          </div>
          <div class="card">
            <h3>Contact Email</h3>
            <div class="value" style="font-size: 14px;">${data.businessEmail}</div>
          </div>
          <div class="card">
            <h3>Environment</h3>
            <div class="value" style="font-size: 18px; text-transform: uppercase;">${data.environment}</div>
          </div>
          <div class="card">
            <h3>Industry</h3>
            <div class="value" style="font-size: 16px;">${data.industry.replace(/_/g, ' ')}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Emails Processed</h3>
            <div class="value">${data.stats.emailsProcessed || 0}</div>
          </div>
          <div class="card">
            <h3>Documents Processed</h3>
            <div class="value">${data.stats.documentsProcessed || 0}</div>
          </div>
          <div class="card">
            <h3>Workflows Executed</h3>
            <div class="value">${data.stats.workflowsExecuted || 0}</div>
          </div>
          <div class="card">
            <h3>API Status</h3>
            <div class="value" style="font-size: 24px;">
              ${data.hasApiKeys ? '✓' : '✗'}
            </div>
          </div>
        </div>

        <div class="card">
          <h3>API Configuration</h3>
          <div class="config-grid">
            <div class="config-item">
              <span class="indicator" style="background: ${data.apiConfigured ? '#22c55e' : '#ef4444'};"></span>
              <span class="label">Anthropic API</span>
            </div>
            <div class="config-item">
              <span class="indicator" style="background: ${data.brevoConfigured ? '#22c55e' : '#ef4444'};"></span>
              <span class="label">Brevo CRM</span>
            </div>
          </div>
        </div>

        <div class="activity-section">
          <h2>Recent Activity</h2>
          <table>
            <tbody>
              ${activityHTML || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9ca3af;">No activity yet</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="api-endpoints">
          <h2>API Endpoints</h2>
          <div class="endpoint">
            <div class="endpoint-method method-get">GET</div>
            <div class="endpoint-path">/ (this dashboard)</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-get">GET</div>
            <div class="endpoint-path">/api/health</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-post">POST</div>
            <div class="endpoint-path">/webhook/email</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-post">POST</div>
            <div class="endpoint-path">/api/process-document</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-post">POST</div>
            <div class="endpoint-path">/api/workflow/trigger</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-get">GET</div>
            <div class="endpoint-path">/api/workflows</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-get">GET</div>
            <div class="endpoint-path">/api/activity</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-get">GET</div>
            <div class="endpoint-path">/api/drafts</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-post">POST</div>
            <div class="endpoint-path">/api/drafts/:id/approve</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-method method-post">POST</div>
            <div class="endpoint-path">/api/drafts/:id/reject</div>
          </div>
        </div>

        <div class="footer">
          <p>TeamAI v1.0.0 • Powered by BridgeAI • ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  getDashboard,
  getHealth
};
