const fs = require('fs');
const path = require('path');

// Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Patterns for detecting secrets
const SECRET_RULES = [
  {
    name: 'Generic API Key / Secret / Password Assignment',
    // Looks for things like const secret = "..." or password: "..."
    // avoiding false positives by requiring a string value that has at least 8 chars
    regex: /(const|let|var|key|secret|password|passwd|token|auth|credential|db_uri|db_pass|jwt_secret)\s*[:=]\s*["'`][a-zA-Z0-9_\-\.\/\+\=\:\@]{8,}["'`]/gi,
    severity: 'warning'
  },
  {
    name: 'Database URL Connection String',
    regex: /(mongodb|postgres|postgresql|mysql|redis):\/\/([^:]+):([^@]+)@/gi,
    severity: 'error'
  },
  {
    name: 'Google API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/g,
    severity: 'error'
  },
  {
    name: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'error'
  },
  {
    name: 'AWS Secret Access Key',
    regex: /[^A-Za-z0-9/+=][A-Za-z0-9/+=]{40}[^A-Za-z0-9/+=]/g,
    // Since this is a high-entropy string matcher, it's safer as a warning to prevent false positives
    severity: 'warning',
    filter: (match) => {
      // Simple entropy estimator to filter out plain text
      const str = match.trim();
      const uniqueChars = new Set(str).size;
      return uniqueChars > 15; // Only match high-entropy strings
    }
  },
  {
    name: 'RSA / EC Private Key',
    regex: /-----BEGIN\s+([A-Z\s]+)?PRIVATE\s+KEY-----/g,
    severity: 'error'
  },
  {
    name: 'Slack Webhook URL',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]+\/B[A-Z0-9_]+\/[A-Za-z0-9_]+/g,
    severity: 'error'
  },
  {
    name: 'Standard JWT Token Signature',
    regex: /eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
    severity: 'error'
  }
];

// Files and folders to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', '.wrangler', 'uploads', 'temp_node_install', '__pycache__'];
const EXCLUDE_FILES = ['package-lock.json', 'security-check.js', 'seo-check.js', '.env.example'];
const EXCLUDE_EXTENSIONS = ['.exe', '.zip', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.ttf', '.woff', '.woff2', '.eot', '.pdf', '.pyc'];


// Exceptions list (hardcoded strings in test files or documentation)
const EXCEPTIONS = [
  'test_fix.js',
  'test_tournament_play.js',
  'dummy_test.csv',
  'stress-test.js',
  'README.md',
  'SEO_SERVER_GUIDE.md'
];

let errorsCount = 0;
let warningsCount = 0;

function logHeader(message) {
  console.log(`\n${COLORS.bold}${COLORS.cyan}=== ${message} ===${COLORS.reset}`);
}

function logSuccess(message) {
  console.log(`${COLORS.green}✓ ${message}${COLORS.reset}`);
}

function logWarning(message) {
  warningsCount++;
  console.warn(`${COLORS.yellow}⚠ WARNING: ${message}${COLORS.reset}`);
}

function logError(message) {
  errorsCount++;
  console.error(`${COLORS.red}✗ ERROR: ${message}${COLORS.reset}`);
}

function scanFile(filePath) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  
  // Skip exceptions/test files or binary extensions
  const ext = path.extname(filePath).toLowerCase();
  if (EXCLUDE_EXTENSIONS.includes(ext) || EXCEPTIONS.some(exc => relativePath.endsWith(exc))) {
    return;
  }


  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  SECRET_RULES.forEach(rule => {
    // Reset regex lastIndex
    rule.regex.lastIndex = 0;

    let match;
    while ((match = rule.regex.exec(content)) !== null) {
      if (rule.filter && !rule.filter(match[0])) {
        continue;
      }

      // Find line number
      const index = match.index;
      const charCountBefore = content.substring(0, index);
      const lineNum = charCountBefore.split('\n').length;
      const lineText = lines[lineNum - 1].trim();

      // Mask the secret for safe printing
      const matchedString = match[0];
      const maskedString = matchedString.length > 8 
        ? matchedString.substring(0, 4) + '...' + matchedString.substring(matchedString.length - 4)
        : '********';

      const logMsg = `Potential ${rule.name} found in ${relativePath}:${lineNum} (Match: "${maskedString}")\n    Line: "${lineText.substring(0, 100)}"`;

      if (rule.severity === 'error') {
        logError(logMsg);
      } else {
        logWarning(logMsg);
      }
    }
  });
}

function traverseDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        traverseDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      if (!EXCLUDE_FILES.includes(file)) {
        scanFile(fullPath);
      }
    }
  });
}

logHeader('STARTING SECURITY SCAN (SECRETS & LEAKAGE CHECK)');
try {
  const rootPath = path.join(__dirname, '..');
  traverseDirectory(rootPath);
} catch (err) {
  logError(`Security scanner failed: ${err.message}\n${err.stack}`);
}

logHeader('SECURITY SCAN REPORT SUMMARY');
console.log(`Critical Secrets Leaks (Errors): ${COLORS.red}${errorsCount}${COLORS.reset}`);
console.log(`Low Risk Secrets / Key Assignments (Warnings): ${COLORS.yellow}${warningsCount}${COLORS.reset}`);

if (errorsCount > 0) {
  console.log(`\n${COLORS.red}${COLORS.bold}CI/CD Security check FAILED. Hardcoded secrets/credentials detected! Please remove them from source code and use environment variables.${COLORS.reset}\n`);
  process.exit(1);
} else {
  console.log(`\n${COLORS.green}${COLORS.bold}CI/CD Security check PASSED successfully (No hardcoded credentials found).${COLORS.reset}\n`);
  process.exit(0);
}
