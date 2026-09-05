const http = require('http');
const os = require('os');
const env = require('../config/env');
const db = require('../config/db');

/**
 * Node.js proxy service that fetches pre-calculated system metrics from
 * the standalone Python monitor daemon (monitor.py on port 5001).
 * Offloads all system sampling from Node's single thread!
 */
class ResourceMonitorService {
  constructor() {
    this.pythonMonitorUrl = env.PYTHON_MONITOR_URL || 'http://127.0.0.1:5001/metrics';
  }

  /**
   * Fetch metrics from Python sidecar daemon
   */
  async fetchFromPythonDaemon() {
    return new Promise((resolve, reject) => {
      const req = http.get(this.pythonMonitorUrl, { timeout: 1500 }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Python monitor HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', err => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Python monitor timeout'));
      });
    });
  }

  /**
   * Node.js fallback metrics if Python daemon is offline
   */
  getNodeFallbackStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const processMem = process.memoryUsage();

    return {
      source: 'node_fallback',
      status: 'fallback',
      cpu: {
        usagePercent: Math.round((1 - freeMem / totalMem) * 50),
        cores: os.cpus().length,
        loadAvg: os.loadavg().map(l => parseFloat(l.toFixed(2))),
        model: os.cpus()[0] ? os.cpus()[0].model : 'CPU'
      },
      memory: {
        totalMemMB: Math.round(totalMem / (1024 * 1024)),
        usedMemMB: Math.round(usedMem / (1024 * 1024)),
        freeMemMB: Math.round(freeMem / (1024 * 1024)),
        usedPercent: Math.round((usedMem / totalMem) * 100)
      },
      disk: { totalGB: 0, usedGB: 0, freeGB: 0, usedPercent: 0 },
      network: { bytesSentMB: 0, bytesRecvMB: 0 },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        pythonVersion: 'N/A',
        uptimeSec: Math.round(process.uptime())
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get combined server metrics (Python Daemon + Node Process Heap + DB Pool)
   */
  async getResourceStats() {
    let metrics;
    try {
      metrics = await this.fetchFromPythonDaemon();
    } catch (err) {
      // Fallback to Node.js metrics if Python daemon is starting or unreachable
      metrics = this.getNodeFallbackStats();
    }

    const processMem = process.memoryUsage();
    metrics.memory.processRssMB = Math.round(processMem.rss / (1024 * 1024));
    metrics.memory.processHeapUsedMB = Math.round(processMem.heapUsed / (1024 * 1024));
    metrics.memory.processHeapTotalMB = Math.round(processMem.heapTotal / (1024 * 1024));

    let dbConnections = { total: 0, idle: 0, waiting: 0 };
    if (db.pool) {
      dbConnections = {
        total: db.pool.totalCount || 0,
        idle: db.pool.idleCount || 0,
        waiting: db.pool.waitingCount || 0
      };
    }
    metrics.dbConnections = dbConnections;
    metrics.thresholds = {
      cpuWarn: env.CPU_WARN_THRESHOLD || 85,
      memoryWarn: env.MEMORY_WARN_THRESHOLD || 90
    };

    return metrics;
  }
}

module.exports = new ResourceMonitorService();
