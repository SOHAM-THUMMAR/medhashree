# 🚀 Medhashree — Competitive Quiz & Learning Platform

Welcome to **Medhashree**! Medhashree is a high-performance, full-stack competitive quiz battleground and learning platform built with React 19, Node.js, Express, Socket.IO, PostgreSQL (with SQLite engine fallback), and a Python system resource monitoring service.

---

## 🌟 Key Platform Features

- **👑 High-End Dark UI Workspace**: Unified design system (`AdminNavBanner`) across Admin Dashboard, User Management, Activity Logs, Content Editor, Tournaments, Bug Reports, and Site Settings.
- **👥 Manage Users Workspace (`/admin/users`)**: 4 real-time stat cards, role filtering (Student, Instructor, Admin), instant search, role dropdown badges, and modal password modification.
- **📋 Zero-Overhead Activity Logging (`/admin/activity-logs`)**: Stored in a JSON file database (`backend/logs/activity.json`) to eliminate database write overhead. Features email search, date filters, severity badges, and `LogInspectorModal`.
- **📧 Multi-Admin Email Alerts**: High-traffic milestones, security triggers, and test emails deliver simultaneously to **all active admin accounts** in the database.
- **🌐 Clean IP & URL Normalization**: Automatically normalizes IPv6 loopbacks (`::1` / `::ffff:`) into clean IPv4 format (`127.0.0.1`) and sanitizes endpoint URLs.
- **🖥️ Python System Resource Monitor**: Real-time sidecar service (`monitor.py` on port 5001) logging CPU, RAM, Disk, and system uptime.
- **📱 Fully Mobile Responsive**: Engineered with fluid viewports (375px+) across mobile devices, tablets, and desktops.

---

## ⚡ Quickstart: Automated Setup with `start.py`

Medhashree includes an automated cross-platform setup script (`start.py`) that works out of the box on **Windows** and **Ubuntu Linux**.

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** (with `pnpm` or `npm`)
- **PostgreSQL 14+** (running locally on port `5432` or via fallback SQLite engine)

### One-Command Setup
Clone the repository and run:

```bash
git clone https://github.com/SOHAM-THUMMAR/medhashree.git
cd medhashree

# Run automated setup script
python start.py
```

#### Ubuntu VPS Production Deployment (One Command):
```bash
sudo python3 start.py --domain yourdomain.com --run
```
*(For complete deployment commands and server instructions, check [DEPLOYMENT.md](DEPLOYMENT.md))*

---

## 🛠️ Contributor & Developer Local Guide

If you are developing features or bug fixes locally, follow these steps:

### 1. Centralized Environment (`.env`)
The project uses a unified `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=medhashree

JWT_SECRET=super_secret_medhashree_jwt_key_2026
ADMIN_EMAIL=sohamthummar04@gmail.com

ENABLE_RESOURCE_MONITORING=true
MONITOR_PORT=5001
PYTHON_MONITOR_URL=http://127.0.0.1:5001/metrics

VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2. Running the Backend Server
```bash
cd backend
pnpm install
pnpm dev
```
- **Backend API**: `http://localhost:5000/api`
- **WebSockets Engine**: `http://localhost:5000/socket.io`

### 3. Running the Python Resource Monitor
```bash
python monitor.py
```
- **Metrics Endpoint**: `http://127.0.0.1:5001/metrics`

### 4. Running the Frontend App
```bash
cd frontend
pnpm install
pnpm dev
```
- **Frontend App**: `http://localhost:5173`

---

## 📁 Repository Architecture

```
medhashree/
├── backend/                  # Node.js Express REST API & Socket.IO WebSockets
│   ├── config/               # Database pool & environment setup (db.js, env.js)
│   ├── controllers/          # Request handlers (auth, admin, quizzes, tournaments)
│   ├── logs/                 # JSON activity log store (activity.json)
│   ├── middleware/           # Auth JWT verification, rate limiting, logger middleware
│   ├── routes/               # Express routing endpoints
│   ├── services/             # Business logic, loggerService, alertEmailService
│   └── server.js             # Express HTTP & Socket.IO server entry point
├── frontend/                 # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── components/       # Modular UI components (AdminNavBanner, Modals, Topbar)
│   │   ├── pages/            # Page views (AdminDashboard, ActivityLogs, ManageUsers)
│   │   └── config/           # API fetch helpers & routing config
│   └── vite.config.js        # Vite bundler configuration
├── scripts/                  # Automated setup scripts
│   └── setup/                # System deps, database setup, PM2 & Nginx setup modules
├── monitor.py                # Python system resource monitor sidecar service (port 5001)
├── start.py                  # Automated cross-platform setup entry point
├── DEPLOYMENT.md             # Complete Ubuntu VPS deployment guide & commands
└── README.md                 # Developer & Contributor Guide
```

---

## 🤝 Contribution Guidelines

We welcome contributions from open-source developers! Follow these steps to contribute:

### Step 1: Fork & Branch
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/medhashree.git
   cd medhashree
   ```
3. Create a feature or bugfix branch:
   ```bash
   git checkout -b feature/awesome-new-quiz-mode
   ```

### Step 2: Code & Verification
- Ensure code adheres to clean modular JavaScript (ESNext) and Python standards.
- Test responsive mobile viewports (375px+).
- When modifying database tables, use `IF NOT EXISTS` migration guards in `backend/config/db.js`.
- Verify production build compiles cleanly:
  ```bash
  cd frontend && pnpm build
  ```

### Step 3: Commit & Push
Use descriptive commit messages:
```bash
git add .
git commit -m "feat(quizzes): add real-time tournament leaderboard updates"
git push origin feature/awesome-new-quiz-mode
```

### Step 4: Create a Pull Request
Open a Pull Request against the `main` branch of [`SOHAM-THUMMAR/medhashree`](https://github.com/SOHAM-THUMMAR/medhashree). Describe your changes and reference any related issue tickets.

---

## 📜 License & Author

- **Project Lead & Owner**: [SOHAM THUMMAR](https://github.com/SOHAM-THUMMAR)
- **Repository**: [https://github.com/SOHAM-THUMMAR/medhashree](https://github.com/SOHAM-THUMMAR/medhashree)
