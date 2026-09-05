import React from 'react';

/**
 * Log Inspector Modal Component
 */
export default function LogInspectorModal({ selectedLog, setSelectedLog, getSeverityBadge }) {
  if (!selectedLog) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Log Inspection #{selectedLog.log_id}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(selectedLog.created_at).toLocaleString()}</p>
          </div>
          <button
            onClick={() => setSelectedLog(null)}
            className="text-slate-400 hover:text-white text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Action</span>
              <span className="text-slate-200 font-bold text-sm">{selectedLog.action}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Severity</span>
              {getSeverityBadge(selectedLog.severity)}
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">User & Email</span>
              <span className="text-indigo-300 font-semibold">{selectedLog.email || selectedLog.username || 'Guest'} {selectedLog.username ? `(@${selectedLog.username.replace(/^@/, '')})` : ''}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">IP Address</span>
              <span className="text-slate-300">{selectedLog.ip_address || 'Unknown'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block uppercase text-[10px]">Endpoint</span>
              <span className="text-slate-300 font-bold">{selectedLog.method} {selectedLog.endpoint}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block uppercase text-[10px]">User Agent</span>
              <span className="text-slate-400 text-[11px] break-all">{selectedLog.user_agent || 'N/A'}</span>
            </div>
          </div>

          {selectedLog.details && (
            <div>
              <span className="text-slate-500 block uppercase text-[10px] mb-1">Payload / Details JSON</span>
              <pre className="bg-slate-950 p-4 rounded-xl text-emerald-400 overflow-x-auto text-[11px] border border-slate-800">
                {typeof selectedLog.details === 'object' 
                  ? JSON.stringify(selectedLog.details, null, 2) 
                  : selectedLog.details}
              </pre>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={() => setSelectedLog(null)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
