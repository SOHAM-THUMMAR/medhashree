import React from 'react';

/**
 * Server Resource Monitor Card Component
 */
export default function ResourceMonitorCard({ resourceStats }) {
  if (!resourceStats) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            🖥️ Real-time Server Resource Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            CPU, Memory usage, Node process heap, and active database connection pool.
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-800 text-indigo-400 rounded-xl text-xs font-mono border border-slate-700">
          {resourceStats.system.hostname} ({resourceStats.system.platform} {resourceStats.system.arch})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        {/* CPU Usage */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 font-medium">CPU Load ({resourceStats.cpu.cores} Cores)</span>
            <span className={`font-bold font-mono ${
              resourceStats.cpu.usagePercent >= resourceStats.thresholds.cpuWarn ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {resourceStats.cpu.usagePercent}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                resourceStats.cpu.usagePercent >= resourceStats.thresholds.cpuWarn ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${resourceStats.cpu.usagePercent}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">{resourceStats.cpu.model}</div>
        </div>

        {/* RAM Memory Usage */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 font-medium">System RAM ({resourceStats.memory.usedMemMB} / {resourceStats.memory.totalMemMB} MB)</span>
            <span className={`font-bold font-mono ${
              resourceStats.memory.usedPercent >= resourceStats.thresholds.memoryWarn ? 'text-red-400' : 'text-indigo-400'
            }`}>
              {resourceStats.memory.usedPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                resourceStats.memory.usedPercent >= resourceStats.thresholds.memoryWarn ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${resourceStats.memory.usedPercent}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500">Free RAM: {resourceStats.memory.freeMemMB} MB</div>
        </div>

        {/* Node Process Heap */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 font-medium">Node.js Process Heap</span>
            <span className="font-bold font-mono text-purple-400">
              {resourceStats.memory.processHeapUsedMB} MB
            </span>
          </div>
          <div className="text-slate-300 font-mono mt-1">
            RSS: {resourceStats.memory.processRssMB} MB
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Uptime: {Math.floor(resourceStats.system.processUptimeSec / 3600)}h {Math.floor((resourceStats.system.processUptimeSec % 3600) / 60)}m
          </div>
        </div>

        {/* PostgreSQL DB Pool */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 font-medium">Database Connections</span>
            <span className="font-bold font-mono text-cyan-400">
              {resourceStats.dbConnections.total} Pool Connections
            </span>
          </div>
          <div className="text-slate-400 font-mono space-y-0.5 mt-1">
            <div>Idle Connections: <span className="text-slate-200">{resourceStats.dbConnections.idle}</span></div>
            <div>Waiting Requests: <span className="text-slate-200">{resourceStats.dbConnections.waiting}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
