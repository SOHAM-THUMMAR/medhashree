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

// -------------------------------------------------------------
// 1. Audit frontend/index.html
// -------------------------------------------------------------
function auditIndexHtml() {
  logHeader('Auditing frontend/index.html');
  const htmlPath = path.join(__dirname, '..', 'frontend', 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    logError(`index.html not found at ${htmlPath}`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check language attribute
  if (/<html\s+([^>]*\s+)?lang=["']([^"']+)["']/i.test(html)) {
    const langMatch = html.match(/<html\s+([^>]*\s+)?lang=["']([^"']+)["']/i);
    logSuccess(`HTML language attribute set to: "${langMatch[2]}"`);
  } else {
    logError('Missing HTML lang attribute (e.g. <html lang="en">)');
  }

  // Check Charset
  if (/<meta\s+([^>]*\s+)?charset=["']?utf-8["']?/i.test(html)) {
    logSuccess('Meta charset is set to UTF-8');
  } else {
    logError('Missing or incorrect meta charset tag (e.g. <meta charset="UTF-8" />)');
  }

  // Check Viewport
  if (/<meta\s+name=["']viewport["']/i.test(html)) {
    logSuccess('Viewport meta tag exists');
  } else {
    logError('Missing viewport meta tag for mobile responsiveness');
  }

  // Check Title tag and length
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    if (title.length >= 30 && title.length <= 60) {
      logSuccess(`Title tag exists and length is optimal: "${title}" (${title.length} chars)`);
    } else {
      logWarning(`Title tag "${title}" length (${title.length} chars) is outside the recommended range of 30-60 characters.`);
    }
  } else {
    logError('Missing <title> tag');
  }

  // Check Meta Description and length
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  if (descMatch) {
    const desc = descMatch[1].trim();
    if (desc.length >= 50 && desc.length <= 160) {
      logSuccess(`Meta description exists and length is optimal (${desc.length} chars)`);
    } else {
      logWarning(`Meta description length (${desc.length} chars) is outside the recommended range of 50-160 characters.`);
    }
  } else {
    logError('Missing <meta name="description"> tag');
  }

  // Check Robots meta tag
  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']robots["']/i);
  if (robotsMatch) {
    logSuccess(`Robots meta tag exists: "${robotsMatch[1]}"`);
  } else {
    logWarning('Missing <meta name="robots"> tag');
  }

  // Check Open Graph (OG) tags
  const ogTitle = /<meta\s+property=["']og:title["']/i.test(html);
  const ogDesc = /<meta\s+property=["']og:description["']/i.test(html);
  const ogType = /<meta\s+property=["']og:type["']/i.test(html);

  if (ogTitle && ogDesc && ogType) {
    logSuccess('Critical Open Graph metadata is present (og:title, og:description, og:type)');
  } else {
    if (!ogTitle) logWarning('Missing Open Graph Title tag (<meta property="og:title" ...>)');
    if (!ogDesc) logWarning('Missing Open Graph Description tag (<meta property="og:description" ...>)');
    if (!ogType) logWarning('Missing Open Graph Type tag (<meta property="og:type" ...>)');
  }

  // Check Twitter cards
  const twitterCard = /<meta\s+name=["']twitter:card["']/i.test(html);
  if (twitterCard) {
    logSuccess('Twitter Card metadata is present');
  } else {
    logWarning('Missing Twitter Card metadata (<meta name="twitter:card" ...>)');
  }
}

// -------------------------------------------------------------
// 2. Audit robots.txt
// -------------------------------------------------------------
function auditRobotsTxt() {
  logHeader('Auditing robots.txt');
  const robotsPath = path.join(__dirname, '..', 'frontend', 'public', 'robots.txt');

  if (!fs.existsSync(robotsPath)) {
    logError(`robots.txt not found at ${robotsPath}`);
    return;
  }

  const content = fs.readFileSync(robotsPath, 'utf8');

  if (/User-agent:/i.test(content)) {
    logSuccess('robots.txt contains User-agent directive');
  } else {
    logError('robots.txt must contain a User-agent directive');
  }

  const sitemapMatch = content.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
  if (sitemapMatch) {
    logSuccess(`robots.txt points to sitemap: "${sitemapMatch[1]}"`);
    if (!sitemapMatch[1].startsWith('https://')) {
      logWarning(`Sitemap URL in robots.txt should use HTTPS: "${sitemapMatch[1]}"`);
    }
  } else {
    logWarning('robots.txt does not contain a Sitemap directive');
  }
}

// -------------------------------------------------------------
// 3. Audit sitemap.xml
// -------------------------------------------------------------
function auditSitemapXml() {
  logHeader('Auditing sitemap.xml');
  const sitemapPath = path.join(__dirname, '..', 'frontend', 'public', 'sitemap.xml');

  if (!fs.existsSync(sitemapPath)) {
    logError(`sitemap.xml not found at ${sitemapPath}`);
    return;
  }

  const content = fs.readFileSync(sitemapPath, 'utf8');

  // Basic XML check
  if (!content.trim().startsWith('<?xml')) {
    logError('sitemap.xml does not start with valid XML declaration');
  } else {
    logSuccess('sitemap.xml starts with valid XML declaration');
  }

  if (/<urlset[^>]*>/i.test(content) && /<\/urlset>/i.test(content)) {
    logSuccess('sitemap.xml has valid <urlset> wrapper tags');
  } else {
    logError('sitemap.xml is missing <urlset> namespace tags');
  }

  // Parse URLs
  const urlLocRegex = /<loc>([^<]+)<\/loc>/gi;
  let locMatch;
  let urlCount = 0;
  let nonHttpsCount = 0;
  const urls = [];

  while ((locMatch = urlLocRegex.exec(content)) !== null) {
    const loc = locMatch[1].trim();
    urlCount++;
    urls.push(loc);
    if (!loc.startsWith('https://')) {
      nonHttpsCount++;
    }
  }

  if (urlCount > 0) {
    logSuccess(`sitemap.xml contains ${urlCount} indexed URLs`);
    if (nonHttpsCount > 0) {
      logError(`sitemap.xml contains ${nonHttpsCount} non-HTTPS URLs out of ${urlCount}. All sitemap URLs should be secure HTTPS!`);
    } else {
      logSuccess('All sitemap URLs use secure HTTPS protocol');
    }
  } else {
    logError('No URLs found inside sitemap.xml');
  }
}

// -------------------------------------------------------------
// 4. Scan Frontend Source Code for SEO/Alt tags & semantic elements
// -------------------------------------------------------------
function scanSourceFiles(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Exclude node_modules and builds
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        scanSourceFiles(fullPath);
      }
    } else if (stat.isFile() && /\.(js|jsx)$/.test(file)) {
      const code = fs.readFileSync(fullPath, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '..'), fullPath);

      // Check for <img> tags without alt attribute
      // Match JSX <img ... /> tags
      const imgRegex = /<img\s+([^>]*)\/?>/gi;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(code)) !== null) {
        const imgAttributes = imgMatch[1];
        
        // Skip check if it has a dynamic attribute spreading, like {...props} or similar
        if (imgAttributes.includes('{...')) {
          continue;
        }

        // Check if alt attribute is present
        if (!/\balt\s*=/i.test(imgAttributes)) {
          // Check line number
          const index = imgMatch.index;
          const linesBefore = code.substring(0, index).split('\n');
          const lineNum = linesBefore.length;
          logWarning(`Missing 'alt' attribute on <img> tag in file ${relativePath}:${lineNum}`);
        }
      }

      // Check for heading hierarchy within single files
      // e.g. finding if there is a h3 or h4 without matching parent headers
      const headings = [];
      const headingRegex = /<h([1-6])[\s>]/gi;
      let hMatch;
      while ((hMatch = headingRegex.exec(code)) !== null) {
        headings.push(parseInt(hMatch[1]));
      }

      if (headings.length > 0) {
        // Check if multiple h1s exist in same file (usually there should only be one per page, but dashboard layout might be complex)
        const h1Count = headings.filter(h => h === 1).length;
        if (h1Count > 1) {
          logWarning(`File ${relativePath} has multiple (${h1Count}) <h1> elements. Prefer a single <h1> per page for search engines.`);
        }

        // Check if structure skips levels (e.g. h1 then h3)
        let maxHeadingSeen = 0;
        for (let i = 0; i < headings.length; i++) {
          const level = headings[i];
          if (maxHeadingSeen > 0 && level > maxHeadingSeen + 1) {
            logWarning(`File ${relativePath} skips heading levels (went from <= H${maxHeadingSeen} to H${level}). Fix heading sequence for better SEO semantics.`);
          }
          maxHeadingSeen = Math.max(maxHeadingSeen, level);
        }
      }
    }
  });
}

// Run audits
logHeader('STARTING SEO & ACCESSIBILITY AUDIT');
try {
  auditIndexHtml();
  auditRobotsTxt();
  auditSitemapXml();

  logHeader('Scanning frontend JSX files for Alt attributes & semantic headings');
  const srcPath = path.join(__dirname, '..', 'frontend', 'src');
  if (fs.existsSync(srcPath)) {
    scanSourceFiles(srcPath);
  } else {
    logError(`Source path not found at ${srcPath}`);
  }
} catch (err) {
  logError(`Audit script failed: ${err.message}\n${err.stack}`);
}

logHeader('SEO AUDIT REPORT SUMMARY');
console.log(`Total Errors: ${COLORS.red}${errorsCount}${COLORS.reset}`);
console.log(`Total Warnings: ${COLORS.yellow}${warningsCount}${COLORS.reset}`);

if (errorsCount > 0) {
  console.log(`\n${COLORS.red}${COLORS.bold}CI/CD SEO validation FAILED. Please resolve the critical errors before merging.${COLORS.reset}\n`);
  process.exit(1);
} else {
  console.log(`\n${COLORS.green}${COLORS.bold}CI/CD SEO validation PASSED successfully.${COLORS.reset}\n`);
  process.exit(0);
}
