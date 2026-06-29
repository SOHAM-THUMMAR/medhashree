# Medhashree — Server-Side SEO Configuration Guide

This guide covers everything you need to do **on your server** to maximize SEO for Medhashree. The frontend code changes (React Helmet, structured data, etc.) are handled in the codebase — this document focuses on **server infrastructure, DNS, and external service setup**.

---

## Table of Contents

1. [Understanding the SEO Challenge (SPA)](#1-understanding-the-seo-challenge-spa)
2. [Nginx Configuration for SEO](#2-nginx-configuration-for-seo)
3. [Prerendering for Search Engines](#3-prerendering-for-search-engines)
4. [DNS & Domain Configuration](#4-dns--domain-configuration)
5. [SSL/TLS (HTTPS)](#5-ssltls-https)
6. [Google Search Console Setup](#6-google-search-console-setup)
7. [Google Analytics 4 Setup](#7-google-analytics-4-setup)
8. [Microsoft Clarity Setup](#8-microsoft-clarity-setup)
9. [Bing Webmaster Tools](#9-bing-webmaster-tools)
10. [robots.txt & Sitemap Verification](#10-robotstxt--sitemap-verification)
11. [Performance Optimization (Server-Side)](#11-performance-optimization-server-side)
12. [Structured Data Validation](#12-structured-data-validation)
13. [Monitoring & Ongoing SEO](#13-monitoring--ongoing-seo)
14. [Cloudflare Pages Specific](#14-cloudflare-pages-specific)
15. [Checklist](#15-checklist)

---

## 1. Understanding the SEO Challenge (SPA)

Medhashree is a **Single Page Application (SPA)** built with React. This means:

- The server sends a single `index.html` file for ALL routes
- JavaScript renders the page content in the browser
- Search engine crawlers (Googlebot) **can** execute JavaScript, but:
  - It's slower to index
  - Some crawlers (Bing, social media bots) have limited JS support
  - Dynamic meta tags set by React Helmet need JS to render

### What This Means for You

| Crawler | JS Support | Action Needed |
|---------|-----------|---------------|
| Googlebot | ✅ Full | Works with React Helmet, but prerendering is faster |
| Bingbot | ⚠️ Limited | Needs prerendering for best results |
| Facebook/Twitter bots | ❌ None | **Must** use prerendering for OG tags to work |
| LinkedIn bot | ❌ None | **Must** use prerendering |

**Bottom line**: For social media sharing previews to work, you need a **prerendering solution** (see Section 3).

---

## 2. Nginx Configuration for SEO

If you serve the frontend via Nginx (recommended for production), use this configuration:

### Basic SPA Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use certbot/Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/medhashree/dist;
    index index.html;

    # ─── SEO: Serve static SEO files directly ───
    location = /robots.txt {
        try_files $uri =404;
        access_log off;
    }

    location = /sitemap.xml {
        try_files $uri =404;
        access_log off;
    }

    location = /favicon.ico {
        try_files $uri =404;
        access_log off;
        log_not_found off;
    }

    # ─── SEO: Security Headers ───
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # ─── Performance: Compression ───
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Brotli (if nginx-brotli module is installed)
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # ─── Performance: Cache Static Assets ───
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ─── API Reverse Proxy ───
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ─── Socket.IO Proxy ───
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ─── SPA Fallback (critical for client-side routing) ───
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Install & Apply

```bash
# 1. Install Nginx
sudo apt update && sudo apt install nginx -y

# 2. Copy config
sudo cp nginx.conf /etc/nginx/sites-available/medhashree
sudo ln -s /etc/nginx/sites-available/medhashree /etc/nginx/sites-enabled/

# 3. Test config
sudo nginx -t

# 4. Reload
sudo systemctl reload nginx
```

---

## 3. Prerendering for Search Engines

### Option A: Prerender.io (Recommended — Easiest)

[Prerender.io](https://prerender.io) is a service that renders your SPA pages for bots and caches the HTML.

**Free tier**: 250 pages/month (sufficient for Medhashree).

#### Step 1: Sign up at prerender.io and get your token

#### Step 2: Add to Nginx config

Add this **before** your `location /` block:

```nginx
# Prerendering for SEO bots
set $prerender 0;

if ($http_user_agent ~* "googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp") {
    set $prerender 1;
}

# Don't prerender for static assets
if ($uri ~* "\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|doc|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|woff2|svg)") {
    set $prerender 0;
}

if ($prerender = 1) {
    rewrite .* /https://$host$request_uri? break;
    proxy_pass http://service.prerender.io;
    proxy_set_header X-Prerender-Token YOUR_PRERENDER_TOKEN_HERE;
}
```

#### Step 3: Test it

```bash
# Simulate Googlebot
curl -A "Googlebot" https://yourdomain.com/

# You should see fully rendered HTML (not just <div id="root"></div>)
```

### Option B: Rendertron (Self-Hosted — Free)

If you want to self-host prerendering:

```bash
# Install Rendertron via Docker
docker run -d --name rendertron -p 3000:3000 googlechrome/rendertron

# Add to Nginx (replace the prerender.io proxy_pass):
# proxy_pass http://localhost:3000/render/https://$host$request_uri;
```

### Option C: No Prerendering (Googlebot-Only Strategy)

If you only care about Google (not social media previews), you can skip prerendering. Google's crawler executes JavaScript well. However:

- ❌ Social media share previews won't show title/image
- ❌ Bing indexing will be poor
- ✅ Google will index correctly (with slight delay)

---

## 4. DNS & Domain Configuration

### Required DNS Records

```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          3600
CNAME   www     yourdomain.com          3600
```

### If Using Cloudflare Pages (Frontend)

Your frontend is already configured for Cloudflare Pages via `wrangler.jsonc`. DNS is managed through Cloudflare:

1. Go to Cloudflare Dashboard → your domain → DNS
2. Verify the CNAME record points to your Pages project
3. Enable "Proxied" (orange cloud) for CDN + DDoS protection

### WWW Redirect

Always redirect `www` to non-www (or vice versa). Pick one canonical domain:

```nginx
server {
    server_name www.yourdomain.com;
    return 301 https://yourdomain.com$request_uri;
}
```

---

## 5. SSL/TLS (HTTPS)

**HTTPS is mandatory for SEO.** Google gives ranking preference to HTTPS sites.

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (auto-configures Nginx)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

### If Using Cloudflare Pages

Cloudflare provides automatic HTTPS — no action needed for the frontend.

For the **backend API**, you still need SSL:
- Either use Cloudflare tunnel/proxy to your VPS
- Or install Let's Encrypt on your VPS for the API subdomain (e.g., `api.yourdomain.com`)

---

## 6. Google Search Console Setup

This is the **most important** external SEO tool.

### Step 1: Add Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Choose "URL prefix" → Enter `https://yourdomain.com`

### Step 2: Verify Ownership

**Easiest method** — HTML file verification:

1. Download the verification HTML file from Google
2. Place it in `frontend/public/` directory
3. Redeploy
4. Click "Verify" in Search Console

**Alternative** — DNS verification:
1. Add the TXT record Google provides to your DNS
2. Wait for propagation (can take up to 48 hours)

### Step 3: Submit Sitemap

1. In Search Console, go to "Sitemaps"
2. Enter: `https://yourdomain.com/sitemap.xml`
3. Click "Submit"

### Step 4: Request Indexing

1. Go to "URL Inspection"
2. Enter your homepage URL
3. Click "Request Indexing"
4. Repeat for key pages:
   - `https://yourdomain.com/` (landing)
   - `https://yourdomain.com/public/solved-papers` (if public)

### Step 5: Monitor

Check weekly for:
- **Coverage** → Fix any errors
- **Core Web Vitals** → Address any issues
- **Mobile Usability** → Ensure no errors
- **Security Issues** → Should be clean

---

## 7. Google Analytics 4 Setup

### Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Admin" → "Create Property"
3. Enter property name: "Medhashree"
4. Choose your reporting timezone and currency

### Step 2: Create Data Stream

1. Choose "Web"
2. Enter your website URL
3. Name the stream "Medhashree Production"
4. Copy the **Measurement ID** (starts with `G-`)

### Step 3: Add to Environment Variables

```bash
# In your frontend .env.production file:
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

The Analytics component in the codebase will automatically load GA4 when this env var is set.

---

## 8. Microsoft Clarity Setup

### Step 1: Create Project

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com)
2. Sign in → "New Project"
3. Enter project name and site URL
4. Copy the **Project ID**

### Step 2: Add to Environment Variables

```bash
# In your frontend .env.production file:
VITE_CLARITY_ID=your_clarity_project_id
```

---

## 9. Bing Webmaster Tools

### Step 1: Add Site

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Import from Google Search Console (easiest) or add manually
3. Verify ownership

### Step 2: Submit Sitemap

1. Go to "Sitemaps"
2. Submit `https://yourdomain.com/sitemap.xml`

---

## 10. robots.txt & Sitemap Verification

After deployment, verify these files are accessible:

```bash
# Check robots.txt
curl https://yourdomain.com/robots.txt

# Expected output:
# User-agent: *
# Allow: /
# Sitemap: https://yourdomain.com/sitemap.xml

# Check sitemap
curl https://yourdomain.com/sitemap.xml

# Should return valid XML
```

### Validate with Google

1. Go to Search Console → "Sitemaps"
2. Verify status shows "Success"
3. Check "robots.txt Tester" (under old Search Console if available)

---

## 11. Performance Optimization (Server-Side)

### Enable Gzip/Brotli Compression

Already included in the Nginx config above. Verify:

```bash
# Check if gzip is working
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com

# Look for: Content-Encoding: gzip
```

### Enable HTTP/2

Already enabled in the Nginx config (`listen 443 ssl http2`). HTTP/2 improves page load speed.

### Set Cache Headers

The Nginx config sets `Cache-Control: public, immutable` with 1-year expiry for hashed assets in `/assets/`. This is safe because Vite generates unique filenames on each build.

### CDN (Content Delivery Network)

If using Cloudflare Pages for frontend → CDN is automatic.

If self-hosting frontend:
1. Set up Cloudflare as a reverse proxy (free tier)
2. Enable "Auto Minify" for JS/CSS/HTML
3. Enable "Brotli" compression
4. Set "Browser Cache TTL" to "Respect Existing Headers"

### Image Optimization

If you add images in the future:
- Use WebP format (30% smaller than JPEG)
- Use `<img loading="lazy">` for below-fold images
- Set explicit `width` and `height` to prevent CLS

---

## 12. Structured Data Validation

After deployment, validate your structured data:

### Google Rich Results Test

1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter your URL
3. Verify all structured data types pass

### Schema.org Validator

1. Go to [validator.schema.org](https://validator.schema.org)
2. Paste your URL or the JSON-LD code
3. Fix any errors or warnings

### Expected Structured Data Types

| Page | Schema Type |
|------|-------------|
| Landing | Organization, WebSite, EducationalOrganization |
| Landing FAQ | FAQPage |
| All pages | BreadcrumbList |

---

## 13. Monitoring & Ongoing SEO

### Weekly Tasks

- [ ] Check Google Search Console for crawl errors
- [ ] Review Core Web Vitals in Search Console
- [ ] Check for new security issues

### Monthly Tasks

- [ ] Review keyword rankings (use free tools like Ubersuggest)
- [ ] Update `sitemap.xml` if new public pages are added
- [ ] Check Google Analytics for traffic trends
- [ ] Review Clarity recordings for UX issues

### After Each Deployment

- [ ] Verify `robots.txt` is accessible
- [ ] Verify `sitemap.xml` is accessible
- [ ] Run Lighthouse audit (Chrome DevTools → Lighthouse)
- [ ] Request re-indexing of changed pages in Search Console

---

## 14. Cloudflare Pages Specific

Since your frontend is deployed on Cloudflare Pages:

### Automatic Benefits (No Action Needed)
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ HTTP/2 and HTTP/3
- ✅ Brotli compression
- ✅ DDoS protection
- ✅ SPA routing (configured in `wrangler.jsonc`)

### Additional Steps

1. **Custom Domain**: In Cloudflare Pages project settings → "Custom domains" → Add your domain
2. **Redirect Rules**: Set up www → non-www redirect:
   - Go to Cloudflare Dashboard → Rules → Redirect Rules
   - Match: `www.yourdomain.com/*`
   - Redirect to: `https://yourdomain.com/${1}`
   - Status: 301

3. **Page Rules for Cache**:
   - `yourdomain.com/assets/*` → Cache Level: Cache Everything, Edge TTL: 1 month
   - `yourdomain.com/robots.txt` → Cache Level: Standard, Edge TTL: 1 day
   - `yourdomain.com/sitemap.xml` → Cache Level: Standard, Edge TTL: 1 day

4. **Web Analytics** (Cloudflare's built-in):
   - Go to Dashboard → Web Analytics → Enable
   - This is privacy-first and doesn't require cookies

---

## 15. Checklist

Use this checklist before and after deploying to production:

### Pre-Deployment
- [ ] Custom domain configured and DNS propagated
- [ ] SSL/TLS certificate active (HTTPS working)
- [ ] `VITE_GA_MEASUREMENT_ID` set in production env (if using GA4)
- [ ] `VITE_CLARITY_ID` set in production env (if using Clarity)
- [ ] Sitemap URLs updated with your actual domain
- [ ] Canonical URLs reference your actual domain
- [ ] OG image URL points to your actual domain

### Post-Deployment
- [ ] `https://yourdomain.com/robots.txt` returns correct content
- [ ] `https://yourdomain.com/sitemap.xml` returns valid XML
- [ ] Google Search Console property verified
- [ ] Sitemap submitted in Search Console
- [ ] Homepage indexing requested
- [ ] Rich Results Test passes
- [ ] Lighthouse SEO score ≥ 90
- [ ] Lighthouse Performance score ≥ 80
- [ ] Social media share preview works (test on [metatags.io](https://metatags.io))

### Backend / API Server
- [ ] Nginx configured as reverse proxy with security headers
- [ ] Gzip/Brotli compression verified
- [ ] HTTP/2 enabled
- [ ] Cache headers correct for `/assets/`
- [ ] CORS configured for production domain only
- [ ] Rate limiting active on auth endpoints
- [ ] `NODE_ENV=production` set
- [ ] Strong `JWT_SECRET` configured (not the default)

---

## Quick Reference: Environment Variables for SEO/Analytics

```bash
# Frontend (.env.production)
VITE_API_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX          # Google Analytics 4
VITE_CLARITY_ID=your_clarity_project_id       # Microsoft Clarity
VITE_SITE_URL=https://yourdomain.com          # For canonical URLs

# Backend (.env)
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com           # CORS whitelist
JWT_SECRET=a_very_strong_random_secret_here   # CHANGE THIS
```

---

*Last updated: June 29, 2026*
