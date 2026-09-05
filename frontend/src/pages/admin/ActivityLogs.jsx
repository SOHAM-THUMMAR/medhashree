import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../../config/api';
import ResourceMonitorCard from '../../components/admin/ResourceMonitorCard';
import AlertSettingsForm from '../../components/admin/AlertSettingsForm';
import LogInspectorModal from '../../components/admin/LogInspectorModal';

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats state
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    securityEvents: 0,
    errorEvents: 0
  });
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [resourceStats, setResourceStats] = useState(null);

  // Alert Settings state
  const [alertConfig, setAlertConfig] = useState({
    threshold: 100,
    enabled: true,
    cooldownMin: 60,
    recipientEmail: ''
  });
  const [alertConfigSaving, setAlertConfigSaving] = useState(false);
  const [alertConfigMsg, setAlertConfigMsg] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState('');

  // Selected Log Modal state
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch Stats, Online Users & Resource Stats
  const fetchStatsAndOnline = async () => {
    try {
      const statsRes = await authFetch('/admin/activity-logs/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      const onlineRes = await authFetch('/admin/online-users');
      const onlineData = await onlineRes.json();
      if (onlineData.success) {
        setOnlineUsers(onlineData.data.onlineUsers || 0);
      }

      const resRes = await authFetch('/admin/resource-stats');
      const resData = await resRes.json();
      if (resData.success) {
        setResourceStats(resData.data);
      }
    } catch (e) {
      console.error('Failed to fetch stats/online/resources:', e);
    }
  };

  // Fetch Alert Config
  const fetchAlertConfig = async () => {
    try {
      const res = await authFetch('/admin/alerts/config');
      const data = await res.json();
      if (data.success) {
        setAlertConfig({
          threshold: data.data.threshold || 100,
          enabled: data.data.enabled !== false,
          cooldownMin: data.data.cooldownMin || 60,
          recipientEmail: data.data.recipientEmail || ''
        });
      }
    } catch (e) {
      console.error('Failed to fetch alert config:', e);
    }
  };

  // Fetch Activity Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page,
        limit: 25,
        severity: severityFilter,
        search: searchQuery
      });
      if (actionFilter) params.append('action', actionFilter);

      const res = await authFetch(`/admin/activity-logs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data.logs || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalLogs(data.data.total || 0);
      } else {
        setError(data.error || 'Failed to load activity logs');
      }
    } catch {
      setError('Server communication error');
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, actionFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
    fetchStatsAndOnline();
    fetchAlertConfig();

    const interval = setInterval(fetchStatsAndOnline, 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Handle saving threshold alert config
  const handleSaveAlertConfig = async (e) => {
    e.preventDefault();
    setAlertConfigSaving(true);
    setAlertConfigMsg('');
    try {
      const res = await authFetch('/admin/alerts/config', {
        method: 'PUT',
        body: JSON.stringify({
          threshold: alertConfig.threshold,
          enabled: alertConfig.enabled,
          cooldownMinutes: alertConfig.cooldownMin,
          recipientEmail: alertConfig.recipientEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setAlertConfigMsg('Alert settings saved successfully!');
        setTimeout(() => setAlertConfigMsg(''), 3000);
      } else {
        setAlertConfigMsg(data.error || 'Failed to save settings');
      }
    } catch {
      setAlertConfigMsg('Server connection error');
    } finally {
      setAlertConfigSaving(false);
    }
  };

  // Handle test alert email
  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    setTestEmailMsg('');
    try {
      const res = await authFetch('/admin/alerts/test', {
        method: 'POST',
        body: JSON.stringify({ targetEmail: alertConfig.recipientEmail })
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailMsg(`✅ Test email sent to ${data.data.recipient}`);
      } else {
        setTestEmailMsg(`❌ Error: ${data.error}`);
      }
    } catch {
      setTestEmailMsg('❌ Failed to connect to server');
    } finally {
      setTestingEmail(false);
    }
  };

  // Export logs helper
  const handleExport = (format) => {
    const params = new URLSearchParams({
      format,
      severity: severityFilter,
      search: searchQuery
    });
    const token = localStorage.getItem('token');
    const exportUrl = `/api/admin/activity-logs/export?${params.toString()}`;
    
    fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_logs.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => alert('Export failed'));
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'security':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">SECURITY</span>;
      case 'error':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">ERROR</span>;
      case 'warning':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">WARNING</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">INFO</span>;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            System & User Activity Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time audit trail of platform events, security triggers, and high-traffic alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg transition text-sm flex items-center gap-2"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg transition text-sm flex items-center gap-2"
          >
            📄 Export JSON
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Real-time Online Users Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Online Now</span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-300">{onlineUsers}</div>
          <div className="text-xs text-gray-400 mt-1">Active users on platform</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Total Logs</div>
          <div className="text-3xl font-extrabold text-slate-100">{stats.totalLogs.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Recorded audit events</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Today's Logs</div>
          <div className="text-3xl font-extrabold text-purple-300">{stats.todayLogs.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Events logged today</div>
        </div>

        <div className="bg-slate-900/90 border border-red-500/20 p-5 rounded-2xl shadow-xl">
          <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Security Alerts</div>
          <div className="text-3xl font-extrabold text-red-400">{stats.securityEvents}</div>
          <div className="text-xs text-gray-400 mt-1">Auth & security triggers</div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/20 p-5 rounded-2xl shadow-xl">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Errors</div>
          <div className="text-3xl font-extrabold text-rose-400">{stats.errorEvents}</div>
          <div className="text-xs text-gray-400 mt-1">Exceptions caught</div>
        </div>
      </div>

      {/* Modular Server Resource Monitoring Dashboard Component */}
      <ResourceMonitorCard resourceStats={resourceStats} />

      {/* Modular Threshold Email Alerts Settings Component */}
      <AlertSettingsForm
        alertConfig={alertConfig}
        setAlertConfig={setAlertConfig}
        handleSaveAlertConfig={handleSaveAlertConfig}
        alertConfigSaving={alertConfigSaving}
        alertConfigMsg={alertConfigMsg}
        handleSendTestEmail={handleSendTestEmail}
        testingEmail={testingEmail}
        testEmailMsg={testEmailMsg}
      />

      {/* Logs Filters Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="security">Security</option>
          </select>

          <input
            type="text"
            placeholder="Search action, user, IP, or path..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs w-full sm:w-64 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400 w-full md:w-auto text-right">
          Showing {logs.length} of {totalLogs} logs
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">Loading activity logs...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 text-xs font-medium">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No activity logs found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Method / Path</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString()} <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getSeverityBadge(log.severity)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">{log.action}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.username ? (
                        <div>
                          <span className="font-medium text-indigo-300">{log.username}</span>
                          {log.role && <span className="text-[10px] text-slate-500 block capitalize">{log.role}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Guest</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 max-w-xs truncate">
                      <span className="font-bold text-slate-400 mr-1.5">{log.method || 'GET'}</span>
                      {log.endpoint}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{log.ip_address || '—'}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        log.status_code >= 500 ? 'bg-red-900/40 text-red-300' :
                        log.status_code >= 400 ? 'bg-amber-900/40 text-amber-300' :
                        'bg-emerald-900/40 text-emerald-300'
                      }`}>
                        {log.status_code || 200}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition"
                      >
                        Inspect 🔍
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modular Inspector Log Modal Component */}
      <LogInspectorModal
        selectedLog={selectedLog}
        setSelectedLog={setSelectedLog}
        getSeverityBadge={getSeverityBadge}
      />
    </div>
  );
}

export default ActivityLogs;
