/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  MEDHASHREE STRESS TEST SUITE
 *  Target: 1 GB RAM / 1 Core server
 *  Goal: Progressively increase load until failure
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const http = require('http');
const { URL } = require('url');

const BASE = process.env.TEST_URL || 'http://localhost:5000';
const RESULTS = [];
let TOTAL_REQUESTS = 0;
let TOTAL_FAILURES = 0;
let TOTAL_TIMEOUTS = 0;

// ─── Utility: Make an HTTP request with timeout ──────────────
function request(urlPath, options = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    const parsed = new URL(urlPath, BASE);
    const timeout = options.timeout || 10000;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const elapsed = Date.now() - start;
        resolve({ status: res.statusCode, elapsed, body, error: null });
      });
    });

    req.on('error', (err) => {
      const elapsed = Date.now() - start;
      resolve({ status: 0, elapsed, body: null, error: err.message });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      const elapsed = Date.now() - start;
      resolve({ status: 0, elapsed, body: null, error: 'TIMEOUT' });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// ─── Utility: Fire N concurrent requests to a path ───────────
async function bombardEndpoint(label, urlPath, concurrency, options = {}) {
  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(request(urlPath, options));
  }
  const results = await Promise.all(promises);

  let successes = 0;
  let failures = 0;
  let timeouts = 0;
  let totalElapsed = 0;
  let minElapsed = Infinity;
  let maxElapsed = 0;

  for (const r of results) {
    totalElapsed += r.elapsed;
    if (r.elapsed < minElapsed) minElapsed = r.elapsed;
    if (r.elapsed > maxElapsed) maxElapsed = r.elapsed;

    if (r.error === 'TIMEOUT') {
      timeouts++;
      TOTAL_TIMEOUTS++;
    } else if (r.error || r.status >= 500) {
      failures++;
      TOTAL_FAILURES++;
    } else {
      successes++;
    }
    TOTAL_REQUESTS++;
  }

  const avgElapsed = Math.round(totalElapsed / results.length);

  const entry = {
    label,
    concurrency,
    successes,
    failures,
    timeouts,
    avgMs: avgElapsed,
    minMs: minElapsed === Infinity ? 0 : minElapsed,
    maxMs: maxElapsed,
    broken: failures > 0 || timeouts > 0,
  };
  RESULTS.push(entry);

  const status = entry.broken
    ? `\x1b[31mBROKEN\x1b[0m (${failures} fails, ${timeouts} timeouts)`
    : `\x1b[32mOK\x1b[0m`;

  console.log(
    `  [${String(concurrency).padStart(4)}x] ${label.padEnd(45)} ${status}  avg=${avgElapsed}ms  min=${entry.minMs}ms  max=${maxElapsed}ms`
  );

  return entry;
}

// ─── Phase Runner ────────────────────────────────────────────
async function runPhase(name, fn) {
  console.log(`\n\x1b[36m━━━ PHASE: ${name} ━━━\x1b[0m`);
  await fn();
}

// ─── Sleep utility ───────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════
//  MAIN TEST EXECUTION
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('\x1b[35m');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     MEDHASHREE STRESS TEST — 1 GB RAM / 1 CORE TARGET      ║');
  console.log('║     Progressively increasing load until failure             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');
  console.log(`Target: ${BASE}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  // ──────────────────────────────────────────────────────────────
  // PHASE 1: Health Check & Warm-up
  // ──────────────────────────────────────────────────────────────
  await runPhase('1 — HEALTH CHECK & WARM-UP', async () => {
    const r = await request('/api/health');
    if (r.error || r.status !== 200) {
      console.log(`\x1b[31m  FATAL: Server not reachable at ${BASE}. Aborting.\x1b[0m`);
      console.log(`  Error: ${r.error || `HTTP ${r.status}`}`);
      process.exit(1);
    }
    console.log(`  Server is alive (${r.elapsed}ms). Starting stress test...\n`);
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 2: Static Asset Serving (Lightweight baseline)
  // ──────────────────────────────────────────────────────────────
  await runPhase('2 — STATIC ASSET SERVING', async () => {
    for (const c of [10, 50, 100, 200, 500]) {
      await bombardEndpoint('GET / (index.html SPA fallback)', '/', c);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 3: Health Endpoint (Minimal, no DB)
  // ──────────────────────────────────────────────────────────────
  await runPhase('3 — HEALTH ENDPOINT (no DB)', async () => {
    for (const c of [10, 50, 100, 200, 500, 1000]) {
      const r = await bombardEndpoint('GET /api/health', '/api/health', c);
      if (r.broken) break;
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 4: Auth – Login Attempts (DB read + bcrypt CPU)
  // ──────────────────────────────────────────────────────────────
  await runPhase('4 — AUTH LOGIN (bcrypt + DB read)', async () => {
    for (const c of [5, 10, 25, 50, 100, 200]) {
      const r = await bombardEndpoint('POST /api/auth/login', '/api/auth/login', c, {
        method: 'POST',
        body: { email: 'stress@test.com', password: 'wrongpassword123' },
      });
      if (r.broken) break;
      await sleep(200); // Brief cooldown between rounds
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 5: Dashboard API (Complex multi-query JOIN endpoint)
  // ──────────────────────────────────────────────────────────────
  await runPhase('5 — DASHBOARD API (heavy DB: 7+ queries per call)', async () => {
    // Use user_id=1 which likely exists; if not, the endpoint handles it gracefully
    for (const c of [5, 10, 25, 50, 100, 150, 200]) {
      const r = await bombardEndpoint(
        'GET /api/users/dashboard/1',
        '/api/users/dashboard/1',
        c
      );
      if (r.broken) break;
      await sleep(300);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 6: Leaderboard (Aggregate query with ORDER BY / LIMIT)
  // ──────────────────────────────────────────────────────────────
  await runPhase('6 — LEADERBOARD (aggregate DB query)', async () => {
    for (const c of [10, 25, 50, 100, 200, 300]) {
      const r = await bombardEndpoint(
        'GET /api/leaderboard/rank/1',
        '/api/leaderboard/rank/1',
        c
      );
      if (r.broken) break;
      await sleep(200);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 7: Fixed Quizzes Listing (JOIN across 4 tables)
  // ──────────────────────────────────────────────────────────────
  await runPhase('7 — FIXED QUIZZES (multi-table JOIN)', async () => {
    for (const c of [10, 25, 50, 100, 200, 400]) {
      const r = await bombardEndpoint(
        'GET /api/fixed-quizzes',
        '/api/fixed-quizzes',
        c
      );
      if (r.broken) break;
      await sleep(200);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 8: Self-Study Categories (DB read)
  // ──────────────────────────────────────────────────────────────
  await runPhase('8 — SELF-STUDY CATEGORIES (DB read)', async () => {
    for (const c of [10, 50, 100, 200, 400]) {
      const r = await bombardEndpoint(
        'GET /api/self-study',
        '/api/self-study',
        c
      );
      if (r.broken) break;
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 9: News (Simple DB read)
  // ──────────────────────────────────────────────────────────────
  await runPhase('9 — NEWS ENDPOINT (simple DB read)', async () => {
    for (const c of [25, 50, 100, 200, 500]) {
      const r = await bombardEndpoint(
        'GET /api/news',
        '/api/news',
        c
      );
      if (r.broken) break;
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 10: Site Settings (Simple key-value read)
  // ──────────────────────────────────────────────────────────────
  await runPhase('10 — SITE SETTINGS (key-value store)', async () => {
    for (const c of [25, 100, 200, 500]) {
      const r = await bombardEndpoint(
        'GET /api/site-settings',
        '/api/site-settings',
        c
      );
      if (r.broken) break;
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 11: MIXED LOAD — Simultaneous multi-endpoint attack
  //           This simulates real production usage
  // ──────────────────────────────────────────────────────────────
  await runPhase('11 — MIXED LOAD (simulated real traffic)', async () => {
    for (const multiplier of [1, 2, 5, 10, 20]) {
      const batch = multiplier * 10;
      console.log(`\n  \x1b[33m--- Mixed batch: ${batch} requests per endpoint (${batch * 5} total) ---\x1b[0m`);
      
      const allPromises = [
        bombardEndpoint('  [MIX] GET /api/health', '/api/health', batch),
        bombardEndpoint('  [MIX] GET /api/users/dashboard/1', '/api/users/dashboard/1', batch),
        bombardEndpoint('  [MIX] GET /api/fixed-quizzes', '/api/fixed-quizzes', batch),
        bombardEndpoint('  [MIX] GET /api/self-study', '/api/self-study', batch),
        bombardEndpoint('  [MIX] GET /api/site-settings', '/api/site-settings', batch),
      ];

      const results = await Promise.all(allPromises);
      const anyBroken = results.some((r) => r.broken);
      if (anyBroken) {
        console.log(`\x1b[31m  >>> BREAKPOINT HIT at mixed batch size ${batch} <<<\x1b[0m`);
        break;
      }
      await sleep(500);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 12: SUSTAINED RAPID FIRE — 30 second endurance run
  // ──────────────────────────────────────────────────────────────
  await runPhase('12 — SUSTAINED RAPID FIRE (30s endurance)', async () => {
    const duration = 30000; // 30 seconds
    const startTime = Date.now();
    let wave = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalTimedOut = 0;

    while (Date.now() - startTime < duration) {
      wave++;
      const concurrency = 50;
      const endpoints = ['/api/health', '/api/users/dashboard/1', '/api/fixed-quizzes'];
      const endpoint = endpoints[wave % endpoints.length];

      const promises = [];
      for (let i = 0; i < concurrency; i++) {
        promises.push(request(endpoint, { timeout: 8000 }));
      }
      const results = await Promise.all(promises);

      let waveFails = 0;
      let waveTimeouts = 0;
      for (const r of results) {
        totalSent++;
        TOTAL_REQUESTS++;
        if (r.error === 'TIMEOUT') { waveTimeouts++; totalTimedOut++; TOTAL_TIMEOUTS++; }
        else if (r.error || r.status >= 500) { waveFails++; totalFailed++; TOTAL_FAILURES++; }
      }

      if (waveFails > 0 || waveTimeouts > 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`  Wave ${wave} @ ${elapsed}s: \x1b[31m${waveFails} fails, ${waveTimeouts} timeouts\x1b[0m (${endpoint})`);
      }

      // No sleep — sustained fire
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const rps = Math.round(totalSent / totalTime);
    console.log(`\n  Endurance complete: ${totalSent} requests in ${totalTime}s = ~${rps} req/s`);
    console.log(`  Failures: ${totalFailed}   Timeouts: ${totalTimedOut}   Success rate: ${(((totalSent - totalFailed - totalTimedOut) / totalSent) * 100).toFixed(1)}%`);
  });

  // ──────────────────────────────────────────────────────────────
  // PHASE 13: CONNECTION POOL EXHAUSTION
  // ──────────────────────────────────────────────────────────────
  await runPhase('13 — CONNECTION POOL EXHAUSTION (massive burst)', async () => {
    for (const c of [100, 300, 500, 750, 1000]) {
      const r = await bombardEndpoint(
        `GET /api/users/dashboard/1 (burst ${c})`,
        '/api/users/dashboard/1',
        c,
        { timeout: 15000 }
      );
      if (r.broken) {
        console.log(`\x1b[31m  >>> DB POOL LIKELY EXHAUSTED at ${c} concurrent <<<\x1b[0m`);
        break;
      }
      await sleep(1000); // Let pool recover
    }
  });

  // ══════════════════════════════════════════════════════════════
  //  FINAL REPORT
  // ══════════════════════════════════════════════════════════════
  console.log('\n\x1b[35m');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    STRESS TEST REPORT                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  console.log(`Total Requests Sent:   ${TOTAL_REQUESTS}`);
  console.log(`Total Failures:        ${TOTAL_FAILURES}`);
  console.log(`Total Timeouts:        ${TOTAL_TIMEOUTS}`);
  console.log(`Overall Success Rate:  ${(((TOTAL_REQUESTS - TOTAL_FAILURES - TOTAL_TIMEOUTS) / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
  console.log(`Finished:              ${new Date().toISOString()}`);

  // Find breaking points
  const brokenResults = RESULTS.filter((r) => r.broken);
  if (brokenResults.length > 0) {
    console.log(`\n\x1b[31m── BREAKING POINTS DETECTED ──\x1b[0m`);
    for (const b of brokenResults) {
      console.log(`  [${b.concurrency}x] ${b.label}  —  ${b.failures} fails, ${b.timeouts} timeouts, avg=${b.avgMs}ms, max=${b.maxMs}ms`);
    }
  } else {
    console.log(`\n\x1b[32m── NO BREAKING POINTS DETECTED — Server held up under all tests! ──\x1b[0m`);
  }

  // Find slowest endpoints
  const sorted = [...RESULTS].sort((a, b) => b.maxMs - a.maxMs);
  console.log(`\n\x1b[33m── SLOWEST ENDPOINTS (by max response time) ──\x1b[0m`);
  for (const s of sorted.slice(0, 10)) {
    const flag = s.maxMs > 5000 ? ' \x1b[31m[CRITICAL]\x1b[0m' : s.maxMs > 2000 ? ' \x1b[33m[SLOW]\x1b[0m' : '';
    console.log(`  ${s.label.padEnd(50)} max=${s.maxMs}ms  avg=${s.avgMs}ms  @${s.concurrency}x${flag}`);
  }

  // Deployment recommendations
  console.log(`\n\x1b[36m── DEPLOYMENT RECOMMENDATIONS (1 GB / 1 Core) ──\x1b[0m`);
  
  const heavyBreak = RESULTS.find(r => r.broken && r.label.includes('dashboard'));
  const poolBreak = RESULTS.find(r => r.broken && r.label.includes('burst'));
  
  if (heavyBreak) {
    console.log(`  [DB] Dashboard broke at ${heavyBreak.concurrency} concurrent. Tune PG max_connections & pool size.`);
  }
  if (poolBreak) {
    console.log(`  [POOL] Connection pool exhausted at ${poolBreak.concurrency} concurrent.`);
  }

  const maxSafeLoad = RESULTS.filter(r => !r.broken && r.concurrency >= 50);
  if (maxSafeLoad.length > 0) {
    const best = maxSafeLoad.reduce((a, b) => a.concurrency > b.concurrency ? a : b);
    console.log(`  [SAFE] Highest sustained safe concurrency: ${best.concurrency}x on "${best.label}"`);
  }

  console.log(`  [MEM]  On 1 GB RAM: keep Node heap < 512MB. Use --max-old-space-size=512`);
  console.log(`  [PG]   Set PostgreSQL shared_buffers=256MB, work_mem=4MB, max_connections=50`);
  console.log(`  [NODE] Run with: NODE_OPTIONS="--max-old-space-size=512" node server.js`);
  console.log(`  [PM2]  Use PM2 with cluster_mode=1, max_restarts=10, autorestart=true`);
  console.log('');
}

main().catch((err) => {
  console.error('Stress test crashed:', err);
  process.exit(1);
});
