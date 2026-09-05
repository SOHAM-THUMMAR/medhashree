#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 Legacy Redirect to Unified Centralized Start Script (start.py)
─────────────────────────────────────────────────────────────────────────────
 Redirects execution to root start.py for Ubuntu deployment and hosting.
─────────────────────────────────────────────────────────────────────────────
"""
import os
import sys
import subprocess

script_dir = os.path.dirname(os.path.abspath(__file__))
root_start = os.path.abspath(os.path.join(script_dir, '..', 'start.py'))

if __name__ == '__main__':
    print("[INFO] Redirecting server setup to root start.py script...")
    sys.exit(subprocess.call([sys.executable, root_start] + sys.argv[1:]))
