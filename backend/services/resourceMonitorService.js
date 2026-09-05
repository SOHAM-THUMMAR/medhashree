const os = require('os');
const env = require('../config/env');
const db = require('../config/db');

class ResourceMonitorService {
  /**
   * Calculate current CPU usage percentage across cores
   */
  async getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = os.cpus().map(cpu => cpu.times);
      setTimeout(() => {
        const endMeasure = os.cpus().map(cpu => cpu.times);
        let totalIdle = 0, totalTick = 0;

        for (let i = 0; i < startMeasure.length; i++) {
          const start = startMeasure[i];
          const end = endMeasure[i];
          const idle = end.idle - start.idle;
          let sum = 0;
          for (const type in start) {
            sum += end[type] - start[type];
          }
          totalIdle += idle;
          totalTick += sum;
        }

        const idlePercent = totalTick > 0 ? (totalIdle / totalTick) : 1;
        const usagePercent = Math.round((1 - idlePercent) * 100);
        resolve(Math.min(100, Math.max(0, usagePercent)));
      }, 100);
    });
  }

  /**
   * Get complete system and process memory metrics
   */
  getMemoryUsage() {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;

    const processMem = process.memoryUsage();

    return {
      totalMemMB: Math.round(totalMemBytes / (1024 * 1024)),
      usedMemMB: Math.round(usedMemBytes / (1024 * 1024)),
      freeMemMB: Math.round(freeMemBytes / (1024 * 1024)),
      usedPercent: Math.round((usedMemBytes / totalMemBytes) * 100),
      processRssMB: Math.round(processMem.rss / (1024 * 1024)),
      processHeapUsedMB: Math.round(processMem.heapUsed / (1024 * 1024)),
      processHeapTotalMB: Math.round(processMem.heapTotal / (1024 * 1024))
    };
  }

  /**
   * Get full server resource metrics snapshot
   */
  async getResourceStats() {
    const cpuUsage = await this.getCpuUsage();
    const memory = this.getMemoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    let dbConnections = { total: 0, idle: 0, waiting: 0 };
    if (db.pool) {
      dbConnections = {
        total: db.pool.totalCount || 0,
        idle: db.pool.idleCount || 0,
        waiting: db.pool.waitingCount || 0
      };
    }

    return {
      enabled: env.ENABLE_RESOURCE_MONITORING,
      cpu: {
        usagePercent: cpuUsage,
        cores: cpus.length,
        model: cpus[0] ? cpus[0].model : 'CPU',
        loadAvg: loadAvg.map(l => parseFloat(l.toFixed(2)))
      },
      memory,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        systemUptimeSec: Math.round(os.uptime()),
        processUptimeSec: Math.round(process.uptime()),
        nodeVersion: process.version
      },
      dbConnections,
      thresholds: {
        cpuWarn: env.CPU_WARN_THRESHOLD,
        memoryWarn: env.MEMORY_WARN_THRESHOLD
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ResourceMonitorService();
