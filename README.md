# Medhashree — Engineering & Contributor Guide

Welcome to **Medhashree**! Medhashree is a high-performance, full-stack competitive quiz and learning battleground platform built with React 19, Node.js, Express, Socket.IO, PostgreSQL, and Python sidecar resource monitoring.

This guide provides everything you need as a contributor or developer to set up, build, test, and contribute to the project on **Windows** and **Ubuntu/Linux**.

---

## ⚡ Quickstart: Automated Setup with `start.py`

Medhashree includes an automated cross-platform setup script ([`start.py`](file:///d:/work%204%20life/medhashree/start.py)) that works out of the box on both **Windows** and **Ubuntu/Linux**.

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** (with `npm` or `pnpm`)
- **PostgreSQL 14+** (running locally on port `5432` or via cloud connection string)

### One-Command Setup
Clone the repository and run:

```bash
# Clone the repository
git clone https://github.com/SOHAM-THUMMAR/medhashree.git
cd medhashree

# Run the cross-platform setup script
python start.py
```

#### What `start.py` Automates:
1. **Centralized `.env`**: Auto-generates a unified `.env` file with secure default secrets if missing.
2. **Environment & Dependency Checks**: Verifies Node.js/Python executables and packages (`psutil`). On Ubuntu, installs missing system packages (`nginx`, `postgresql`, `pm2`, `certbot`, `ufw`).
3. **Database Configuration**: Verifies PostgreSQL connection parameters and service status.
4. **Backend Setup**: Installs backend dependencies (`pnpm`/`npm`), runs database schema migrations ([`backend/config/db.js`](file:///d:/work%204%20life/medhashree/backend/config/db.js)), and creates PM2 ecosystem configurations.
5. **Frontend Compilation**: Installs React dependencies and compiles production Vite assets into [`frontend/dist`](file:///d:/work%204%20life/medhashree/frontend/dist).
6. **Reverse Proxy & Firewall**: Configures Nginx site definitions and UFW firewall rules on Ubuntu servers.

---

## 🛠️ Local Development Guide

If you are developing features or bug fixes locally, follow these steps to run each component in development mode:

### 1. Centralized Environment (`.env`)
The project uses a unified `.env` file in the root directory. Ensure your `.env` contains:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=medhashree
DB_SSL=false

JWT_SECRET=your_super_secret_jwt_key

ENABLE_RESOURCE_MONITORING=true
MONITOR_PORT=5001
PYTHON_MONITOR_URL=http://127.0.0.1:5001/metrics

VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2. Running the Backend Server
```bash
cd backend
pnpm install   # or npm install
pnpm dev       # or npm run dev
```
- **Backend REST API**: `http://localhost:5000/api`
- **WebSockets Engine**: `http://localhost:5000/socket.io`

### 3. Running the Python Resource Monitor
```bash
python monitor.py
```
- **Sidecar Metrics Endpoint**: `http://127.0.0.1:5001/metrics`

### 4. Running the Frontend App
```bash
cd frontend
pnpm install   # or npm install
pnpm dev       # or npm run dev
```
- **Frontend App**: `http://localhost:5173`

---

## 📁 Repository Architecture

```
medhashree/
├── backend/                  # Node.js Express REST API & Socket.IO WebSockets
│   ├── config/               # Database pool & environment variables setup
│   ├── controllers/          # Request handlers (auth, quizzes, tournaments, users)
│   ├── handlers/             # Socket event handlers (battles, matchmaking)
│   ├── middleware/           # Auth JWT verification, rate limiting, error handlers
│   ├── models/               # Data access queries
│   ├── routes/               # Express routing endpoints
│   ├── services/             # Business logic & resource monitoring services
│   └── server.js             # HTTP server entry point
├── frontend/                 # React 19 + Vite Single Page Application
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/       # Modular UI components (Navbar, Modals, Battle cards)
│   │   ├── context/          # React Contexts (AuthContext, SocketContext)
│   │   ├── pages/            # Page views (Home, Dashboard, QuizPlayView, Tournaments)
│   │   └── services/         # API client & axios instances
│   ├── package.json          # Dependencies & npm scripts
│   └── vite.config.js        # Vite bundler configuration
├── scripts/                  # Cross-platform automated setup scripts
│   └── setup/
│       ├── backend_setup.py  # Backend NPM setup & PM2 manager
│       ├── database_setup.py # PostgreSQL configuration & service checks
│       ├── env_manager.py    # Centralized .env generator & loader
│       ├── frontend_setup.py # React Vite production asset builder
│       ├── nginx_setup.py    # Nginx reverse proxy & firewall setup
│       └── system_deps.py   # OS package & environment verifier
├── monitor.py                # Python system resource monitor sidecar service (port 5001)
├── start.py                  # Automated setup entry point (cross-platform)
└── docker-compose.yml        # Docker deployment configuration
```

---

## 🤝 Contribution Guidelines

We welcome contributions from developers! Follow these guidelines to get started:

### Step 1: Fork & Branch
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/medhashree.git
   cd medhashree
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/awesome-new-quiz-mode
   # or for bug fixes:
   git checkout -b fix/auth-token-refresh
   ```

### Step 2: Code & Test
- Follow modular JavaScript / Python coding standards.
- Ensure cross-platform compatibility (test code on Windows or Linux).
- When modifying database tables, append safe migrations in [`backend/config/db.js`](file:///d:/work%204%20life/medhashree/backend/config/db.js) using `IF NOT EXISTS` guards.

### Step 3: Commit & Push
Use clear commit messages:
```bash
git add .
git commit -m "feat: add real-time tournament leaderboard updates via Socket.IO"
git push origin feature/awesome-new-quiz-mode
```

### Step 4: Create a Pull Request
1. Open a Pull Request against the `main` branch.
2. Describe your changes clearly and link any associated issues.

---

## 🚀 Production Hosting (Ubuntu VPS)

For production deployment on an Ubuntu VPS with automated Nginx reverse proxy, SSL certificates, and PM2 process daemons:

```bash
sudo python3 start.py --domain medhashree.com
```

Refer to [SEO_SERVER_GUIDE.md](file:///d:/work%204%20life/medhashree/SEO_SERVER_GUIDE.md) for detailed search engine optimization and production server tuning.
