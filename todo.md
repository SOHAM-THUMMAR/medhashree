# Medhashree Setup, Testing, and Deployment TO-DO Checklist

This file contains the complete checklist and all commands needed to configure, test, and automate the Medhashree platform locally and on your production server.

---

## 📋 Table of Contents
1. [Environment Setup](#1-environment-setup)
2. [Local Quality & Security Verification](#2-local-quality--security-verification)
3. [Production Server Setup & Automation](#3-production-server-setup--automation)
4. [GitHub Actions CI/CD Pipeline Checks](#4-github-actions-cicd-pipeline-checks)

---

## 1. Environment Setup

Before executing audits or running scripts, ensure all package dependencies are installed.

### Install Root & Validation Tool Dependencies
From the repository root:
```bash
# Clean install of all dependencies in the repository
npm install
```

### Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 2. Local Quality & Security Verification

Run these commands to verify code style, syntax, dependencies, duplicate logic, security secrets, and SEO.

### A. Code Syntax & Linting Checks
Catch syntax errors and code smells using ESLint.

```bash
# Check Frontend Syntax & React Best Practices
cd frontend
npm run lint
cd ..

# Check Backend Node.js Server CommonJS Syntax
cd backend
npm run lint
cd ..
```

### B. Project Build Verification
Verify that the React code compiles and bundles successfully.

```bash
cd frontend
npm run build
cd ..
```

### C. Security & Vulnerability Audits
Scan dependencies and source code for security vulnerabilities.

```bash
# Audit Backend Package Vulnerabilities
cd backend
npm audit --audit-level=high
cd ..

# Audit Frontend Package Vulnerabilities
cd frontend
npm audit --audit-level=high
cd ..

# Scan Codebase for Leaked Secrets & Credentials (API Keys, Passwords, etc.)
node scripts/security-check.js
```

### D. SEO & Accessibility Check
Audit HTML meta headers, structured data, sitemaps, robots.txt, dynamic headings, and image alt attributes.

```bash
# Run SEO Validator
node scripts/seo-check.js
```

### E. Code Quality & Copy-Paste Duplication Detector
Identify redundant code blocks.

```bash
# Run duplicate code detector
npx jscpd --min-tokens 80 --min-lines 15 frontend/src backend/controllers backend/routes backend/services backend/models
```

---

## 3. Production Server Setup & Automation

Deploying to your VPS (Ubuntu/Debian) is simplified using our Python server script.

### Configuration
1. Make sure your `backend/.env` file contains your target database connection details and domain name:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_NAME=quizdash
   DOMAIN_NAME=yourdomain.com
   ```

### Execution Commands (Run on your VPS)

```bash
# 1. Run the Python Script in Dry-Run mode to review the generated Nginx config
python3 scripts/server-setup.py

# 2. Run the script with root/sudo privileges to apply Nginx changes and create PostgreSQL database
sudo python3 scripts/server-setup.py
```

### System Configuration Fallbacks (If manual setup is needed)
If you need to reload services or check logs manually:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL service
sudo systemctl start postgresql

# Check Nginx config syntax
sudo nginx -t

# Reload Nginx server
sudo systemctl reload nginx

# Check PM2 backend processes
pm2 status
```

---

## 4. GitHub Actions CI/CD Pipeline Checks

Whenever code is pushed or a PR is created to `main`, `master`, or `dev` branches, the automated pipeline in `.github/workflows/ci.yml` runs the following jobs:

| Job | Description | Command Run in CI |
| :--- | :--- | :--- |
| **Syntax & Lint Checks** | Validates backend & frontend code styling and builds frontend. | `npm run lint` & `npm run build` |
| **Quality & Maintenance** | Checks for copy-paste code and unused packages. | `jscpd` & `depcheck` |
| **Security & Vulnerabilities**| Checks for insecure libraries and leaked keys. | `npm audit` & `node scripts/security-check.js` |
| **CodeQL SAST Scanning** | Performs GitHub's security analyzer scan. | `github/codeql-action/analyze` |
| **SEO & Accessibility** | Validates metadata tags, sitemaps, and headings. | `node scripts/seo-check.js` |
