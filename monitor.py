#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 Medhashree - Standalone Python System & Resource Monitor Daemon (monitor.py)
─────────────────────────────────────────────────────────────────────────────
 Purpose: Offloads CPU, RAM, Disk, and Network monitoring from Node.js event
 loop to a dedicated Python process running on port 5001.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import json
import socket
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

# Try importing psutil for high-accuracy metrics, fallback gracefully if not installed
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

PORT = int(os.environ.get("MONITOR_PORT", 5001))

class MetricsCollector:
    def __init__(self):
        self.start_time = time.time()

    def get_metrics(self):
        uptime_sec = int(time.time() - self.start_time)
        
        if HAS_PSUTIL:
            cpu_usage = psutil.cpu_percent(interval=0.1)
            cpu_cores = psutil.cpu_count(logical=True)
            load_avg = [round(x, 2) for x in os.getloadavg()] if hasattr(os, 'getloadavg') else [0, 0, 0]
            
            mem = psutil.virtual_memory()
            memory_data = {
                "totalMemMB": round(mem.total / (1024 * 1024)),
                "usedMemMB": round(mem.used / (1024 * 1024)),
                "freeMemMB": round(mem.available / (1024 * 1024)),
                "usedPercent": round(mem.percent)
            }

            disk = psutil.disk_usage('/')
            disk_data = {
                "totalGB": round(disk.total / (1024 * 1024 * 1024), 1),
                "usedGB": round(disk.used / (1024 * 1024 * 1024), 1),
                "freeGB": round(disk.free / (1024 * 1024 * 1024), 1),
                "usedPercent": round(disk.percent)
            }

            net = psutil.net_io_counters()
            network_data = {
                "bytesSentMB": round(net.bytes_sent / (1024 * 1024), 2),
                "bytesRecvMB": round(net.bytes_recv / (1024 * 1024), 2)
            }

            cpu_model = "Multi-core CPU"
        else:
            # Basic fallback without psutil
            cpu_usage = 0
            cpu_cores = os.cpu_count() or 1
            load_avg = [round(x, 2) for x in os.getloadavg()] if hasattr(os, 'getloadavg') else [0, 0, 0]
            memory_data = {"totalMemMB": 0, "usedMemMB": 0, "freeMemMB": 0, "usedPercent": 0}
            disk_data = {"totalGB": 0, "usedGB": 0, "freeGB": 0, "usedPercent": 0}
            network_data = {"bytesSentMB": 0, "bytesRecvMB": 0}
            cpu_model = "Generic CPU"

        return {
            "source": "python_monitor_service",
            "status": "healthy",
            "cpu": {
                "usagePercent": cpu_usage,
                "cores": cpu_cores,
                "loadAvg": load_avg,
                "model": cpu_model
            },
            "memory": memory_data,
            "disk": disk_data,
            "network": network_data,
            "system": {
                "hostname": socket.gethostname(),
                "platform": sys.platform,
                "pythonVersion": sys.version.split()[0],
                "uptimeSec": uptime_sec
            },
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

collector = MetricsCollector()

class MetricsHTTPRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silence default request logging to avoid terminal noise
        pass

    def do_GET(self):
        if self.path in ["/metrics", "/health", "/"]:
            metrics = collector.get_metrics()
            body = json.dumps(metrics).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

def append_system_metric_log(metrics):
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        logs_dir = os.path.join(base_dir, "backend", "logs")
        os.makedirs(logs_dir, exist_ok=True)
        logs_file = os.path.join(logs_dir, "activity.json")

        logs = []
        if os.path.exists(logs_file):
            try:
                with open(logs_file, "r", encoding="utf-8") as f:
                    raw = f.read().strip()
                    if raw:
                        logs = json.loads(raw)
            except Exception:
                logs = []

        max_id = max([item.get("log_id", 0) for item in logs], default=0)

        entry = {
            "log_id": max_id + 1,
            "user_id": None,
            "username": "python_monitor_service",
            "role": "system",
            "action": "SYSTEM_RESOURCE_METRICS",
            "method": "MONITOR",
            "endpoint": "/metrics",
            "ip_address": "127.0.0.1",
            "user_agent": f"Python/{sys.version.split()[0]} (psutil)",
            "status_code": 200,
            "severity": "info",
            "details": {
                "cpuUsagePercent": metrics["cpu"]["usagePercent"],
                "cpuCores": metrics["cpu"]["cores"],
                "memUsedMB": metrics["memory"]["usedMemMB"],
                "memTotalMB": metrics["memory"]["totalMemMB"],
                "memUsedPercent": metrics["memory"]["usedPercent"],
                "diskUsedGB": metrics["disk"]["usedGB"],
                "diskTotalGB": metrics["disk"]["totalGB"],
                "diskUsedPercent": metrics["disk"]["usedPercent"],
                "uptimeSec": metrics["system"]["uptimeSec"]
            },
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
        }

        logs.insert(0, entry)
        if len(logs) > 10000:
            logs = logs[:10000]

        with open(logs_file, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        print(f"[Python Monitor Log Error] {e}")

def background_logger_loop():
    while True:
        try:
            metrics = collector.get_metrics()
            append_system_metric_log(metrics)
        except Exception as e:
            print(f"[Python Monitor Loop Warning] {e}")
        time.sleep(60)

def run_server():
    # Start background logging thread
    log_thread = Thread(target=background_logger_loop, daemon=True)
    log_thread.start()

    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, MetricsHTTPRequestHandler)
    print(f"[Python Monitor] Service running on http://127.0.0.1:{PORT}/metrics")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Python Monitor] Shutting down...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
