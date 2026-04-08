/**
 * In-memory activity log for TeamAI operations
 * In production, this would connect to a database
 */

const MAX_LOG_ENTRIES = 10000;
const activityLog = [];

/**
 * Log an activity
 */
function log(entry) {
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...entry
  };

  activityLog.push(logEntry);

  // Keep log size manageable
  if (activityLog.length > MAX_LOG_ENTRIES) {
    activityLog.shift();
  }

  // Console output for development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${logEntry.timestamp.toISOString()}] ${logEntry.type}: ${logEntry.message || ''}`);
  }

  return logEntry;
}

/**
 * Get all activity logs
 */
function getActivity(limit = 100, offset = 0) {
  return activityLog
    .slice()
    .reverse()
    .slice(offset, offset + limit);
}

/**
 * Get recent activity (for dashboard)
 */
function getRecentActivity(limit = 10) {
  return activityLog
    .slice()
    .reverse()
    .slice(0, limit);
}

/**
 * Get activity by type
 */
function getActivityByType(type, limit = 50) {
  return activityLog
    .filter(entry => entry.type === type)
    .slice()
    .reverse()
    .slice(0, limit);
}

/**
 * Get activity by date range
 */
function getActivityByDateRange(startDate, endDate, limit = 100) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return activityLog
    .filter(entry => entry.timestamp >= start && entry.timestamp <= end)
    .slice()
    .reverse()
    .slice(0, limit);
}

/**
 * Get activity statistics
 */
function getStats() {
  const stats = {
    totalEntries: activityLog.length,
    emailsProcessed: 0,
    emailsSent: 0,
    documentsProcessed: 0,
    workflowsStarted: 0,
    workflowsCompleted: 0,
    workflowsFailed: 0,
    brevoSyncs: 0,
    errors: 0,
    by24Hours: 0,
    byType: {}
  };

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const entry of activityLog) {
    // Count by type
    if (!stats.byType[entry.type]) {
      stats.byType[entry.type] = 0;
    }
    stats.byType[entry.type]++;

    // Count specific metrics
    switch (entry.type) {
      case 'email_received':
      case 'email_processed':
        stats.emailsProcessed++;
        break;
      case 'email_sent':
        stats.emailsSent++;
        break;
      case 'document_processed':
        stats.documentsProcessed++;
        break;
      case 'workflow_started':
        stats.workflowsStarted++;
        break;
      case 'workflow_completed':
        stats.workflowsCompleted++;
        break;
      case 'workflow_failed':
        stats.workflowsFailed++;
        break;
      case 'brevo_contact_created':
      case 'brevo_contact_updated':
        stats.brevoSyncs++;
        break;
      case 'error':
        stats.errors++;
        break;
    }

    // Count last 24 hours
    if (entry.timestamp >= twentyFourHoursAgo) {
      stats.by24Hours++;
    }
  }

  return stats;
}

/**
 * Get error logs
 */
function getErrors(limit = 50) {
  return activityLog
    .filter(entry => entry.type === 'error')
    .slice()
    .reverse()
    .slice(0, limit);
}

/**
 * Get summary statistics
 */
function getSummary() {
  const stats = getStats();
  const recentActivity = getRecentActivity(5);

  return {
    stats,
    recentActivity,
    totalActivityEntries: activityLog.length,
    oldestEntry: activityLog.length > 0 ? activityLog[0].timestamp : null,
    newestEntry: activityLog.length > 0 ? activityLog[activityLog.length - 1].timestamp : null
  };
}

/**
 * Clear activity log (useful for testing)
 */
function clear() {
  const count = activityLog.length;
  activityLog.length = 0;
  log({
    type: 'system',
    message: `Activity log cleared (${count} entries removed)`
  });
  return count;
}

/**
 * Export activity logs as JSON
 */
function exportAsJSON() {
  return JSON.stringify(activityLog, null, 2);
}

/**
 * Export activity logs as CSV
 */
function exportAsCSV() {
  if (activityLog.length === 0) {
    return 'timestamp,type,message\n';
  }

  const headers = ['timestamp', 'type', 'message', 'data'];
  const rows = activityLog.map(entry => [
    entry.timestamp.toISOString(),
    entry.type,
    entry.message || '',
    JSON.stringify(entry).replace(/"/g, '""')
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Search activity logs
 */
function search(query) {
  const q = query.toLowerCase();

  return activityLog.filter(entry =>
    (entry.type && entry.type.toLowerCase().includes(q)) ||
    (entry.message && entry.message.toLowerCase().includes(q)) ||
    (entry.email && entry.email.toLowerCase().includes(q)) ||
    (entry.from && entry.from.toLowerCase().includes(q))
  );
}

module.exports = {
  log,
  getActivity,
  getRecentActivity,
  getActivityByType,
  getActivityByDateRange,
  getStats,
  getErrors,
  getSummary,
  clear,
  exportAsJSON,
  exportAsCSV,
  search
};
