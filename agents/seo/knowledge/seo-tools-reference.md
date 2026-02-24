# SEO Tools Reference — Quick Reference Guide

## Google Search Console (GSC)

### Key Reports

| Report | What It Shows | Where to Find |
|--------|--------------|---------------|
| **Performance** | Clicks, impressions, CTR, position by query/page/country/device | Performance → Search results |
| **Index Coverage** (now "Pages") | Indexed, not indexed, errors, exclusions | Pages (Indexing) |
| **Core Web Vitals** | LCP, INP, CLS pass rates (mobile + desktop) | Experience → Core Web Vitals |
| **Enhancements** | Schema markup validation by type | Enhancements → [Schema type] |
| **Links** | Top linked pages, top linking sites, top anchor text | Links |
| **URL Inspection** | Crawl/index status for a specific URL, live test | URL Inspection (top bar) |
| **Sitemaps** | Submitted sitemaps, status, discovered URLs | Sitemaps (Indexing) |
| **Removals** | Temporarily remove URLs from search results | Removals (Indexing) |

### Power User Tips

- **Compare date ranges:** Performance → Date filter → Compare. Essential for measuring impact of changes.
- **Regex filtering:** Performance → Query/Page filter → Custom (regex). Examples:
  - `.*buy.*|.*price.*|.*cost.*` — transactional queries
  - `.*how.*|.*what.*|.*why.*` — informational queries
  - `.*best.*|.*top.*|.*review.*` — commercial investigation
- **Position filtering for quick wins:** Filter for average position 5-15 → sort by impressions → these are keywords almost on page 1 that need a push.
- **CTR analysis:** Group by position range, compare CTR to benchmarks:
  - Position 1: ~28-32% CTR
  - Position 2: ~15-18%
  - Position 3: ~10-12%
  - Position 4-5: ~6-8%
  - Position 6-10: ~2-4%
  - If your CTR is significantly below these, your title/description needs improvement.

### GSC API

```
Base URL: https://searchconsole.googleapis.com/webmasters/v3

# Search Analytics (Performance data)
POST /sites/{siteUrl}/searchAnalytics/query
{
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "dimensions": ["query", "page"],
  "rowLimit": 25000,
  "startRow": 0,
  "dimensionFilterGroups": [{
    "filters": [{
      "dimension": "country",
      "operator": "equals",
      "expression": "usa"
    }]
  }]
}

# URL Inspection
POST /sites/{siteUrl}/urlInspection/index:inspect
{
  "inspectionUrl": "https://example.com/page/",
  "siteUrl": "https://example.com/"
}
```

**Rate limits:** 1,200 queries per minute per project. Paginate with `startRow` for sites with >25K queries.

**Libraries:** `google-auth` + `googleapiclient` (Python), `googleapis` (Node.js)

## Google Analytics 4 (GA4)

### Key Reports for SEO

| Report | What to Look For | Navigation |
|--------|-----------------|------------|
| **Traffic Acquisition** | Organic sessions, users, engagement | Reports → Acquisition → Traffic acquisition → filter "Organic Search" |
| **Landing Pages** | Top organic entry points, engagement rate, conversions | Reports → Engagement → Landing page |
| **Conversions** | Goals completed from organic traffic | Reports → Engagement → Conversions → filter source |
| **User Journey** | Path from organic landing to conversion | Explore → Path exploration |

### GA4 for SEO Analysis

**Custom exploration for organic landing page performance:**
1. Explore → Free Form
2. Dimensions: Landing page, Session source/medium
3. Metrics: Sessions, Engaged sessions, Engagement rate, Conversions, Revenue
4. Filter: Session source/medium contains "organic"

**Tip:** GA4 doesn't show keyword data (it's "not provided"). Use GSC for keyword data and GA4 for on-site behavior and conversions. Connect them via the GSC integration in GA4 (Admin → Search Console Linking).

### GA4 Data API

```
Base URL: https://analyticsdata.googleapis.com/v1beta

POST /properties/{propertyId}:runReport
{
  "dateRanges": [{"startDate": "2025-01-01", "endDate": "2025-01-31"}],
  "dimensions": [
    {"name": "landingPage"},
    {"name": "sessionSourceMedium"}
  ],
  "metrics": [
    {"name": "sessions"},
    {"name": "engagedSessions"},
    {"name": "conversions"}
  ],
  "dimensionFilter": {
    "filter": {
      "fieldName": "sessionSourceMedium",
      "stringFilter": {
        "matchType": "CONTAINS",
        "value": "organic"
      }
    }
  }
}
```

## Screaming Frog SEO Spider

### Essential Crawl Configurations

**Before crawling:**
- Set user-agent to Googlebot (Configuration → User-Agent → Googlebot)
- Enable JavaScript rendering if the site uses CSR (Configuration → Spider → Rendering → JavaScript)
- Set crawl speed appropriately (Configuration → Speed → Max Threads: 5 for live sites, higher for staging)
- Respect robots.txt OR uncheck it to see everything Google might miss

### Key Audits

| Audit | How to Run | What to Look For |
|-------|-----------|-----------------|
| **Duplicate titles** | Page Titles tab → filter "Duplicate" | Pages sharing titles = cannibalization risk |
| **Missing meta descriptions** | Meta Description tab → filter "Missing" | Pages without descriptions |
| **Broken links (4xx)** | Response Codes tab → filter "Client Error (4xx)" | Internal links pointing to 404s |
| **Redirect chains** | Response Codes tab → filter "Redirect (3xx)" → check "Redirect Chains" | Chains of 2+ redirects |
| **Orphan pages** | Crawl Analysis → Orphan Pages (requires GSC/Analytics integration) | Pages with no internal links |
| **Thin content** | Page Titles or custom extraction → sort by word count | Pages under 300 words |
| **Canonical issues** | Canonicals tab → filter "Non-Indexable Canonical" | Pages with canonicals pointing elsewhere |
| **hreflang errors** | Hreflang tab → filter errors | Missing return links, incorrect codes |
| **Schema validation** | Structured Data tab (with JS rendering enabled) | Missing or invalid schema |
| **Internal link distribution** | Crawl Analysis → Link Score | Pages with very few internal links |

### Custom Extraction (for advanced audits)

Extract specific elements from every page:
- Configuration → Custom → Extraction
- Use XPath or CSS selectors:
  - Schema markup: `//script[@type='application/ld+json']` (XPath)
  - Author name: `.author-name` (CSS)
  - Publish date: `//meta[@property='article:published_time']/@content` (XPath)
  - Word count: Built-in (no custom extraction needed)

### Screaming Frog CLI (for automation)

```bash
# Run a crawl from command line
/Applications/Screaming\ Frog\ SEO\ Spider.app/Contents/MacOS/ScreamingFrogSEOSpiderLauncher \
  --crawl https://example.com \
  --headless \
  --save-crawl /output/crawl.seospider \
  --export-tabs "Internal:All,Response Codes:All,Page Titles:All" \
  --output-folder /output/reports/ \
  --overwrite
```

## Ahrefs

### Key Features for SEO

| Feature | Use Case | Navigation |
|---------|----------|------------|
| **Site Explorer** | Analyze any site's backlinks, organic keywords, and traffic | Site Explorer → enter domain |
| **Keywords Explorer** | Keyword research, difficulty, volume, SERP analysis | Keywords Explorer → enter seed keywords |
| **Content Explorer** | Find content by topic, filter by links/traffic/date | Content Explorer → enter topic |
| **Site Audit** | Technical SEO crawl with issue detection | Site Audit → create project |
| **Rank Tracker** | Track keyword positions over time | Rank Tracker → add keywords |
| **Link Intersect** | Find who links to competitors but not you | More → Link Intersect |
| **Content Gap** | Find keywords competitors rank for that you don't | Site Explorer → Content Gap |

### Ahrefs API v3

```
Base URL: https://api.ahrefs.com/v3

# Get backlinks for a domain
GET /site-explorer/all-backlinks?target=example.com&limit=50&mode=domain&select=url_from,url_to,anchor,domain_rating_source,first_seen

# Get organic keywords
GET /site-explorer/organic-keywords?target=example.com&limit=50&mode=domain&select=keyword,volume,position,url,traffic

# Get referring domains
GET /site-explorer/refdomains?target=example.com&limit=50&mode=domain

Headers:
Authorization: Bearer YOUR_API_TOKEN
Accept: application/json
```

**API limits:** Depend on plan. Standard: 500 rows per request, 1 request per second.

### Key Ahrefs Metrics

- **Domain Rating (DR):** Ahrefs' measure of a domain's backlink profile strength (0-100 logarithmic scale). DR 50+ is "strong" for most niches. DR 70+ is exceptional.
- **URL Rating (UR):** Same as DR but for individual URLs.
- **Keyword Difficulty (KD):** Estimated difficulty to rank in top 10 (0-100). Based primarily on backlink profiles of current top 10. KD 0-10 = easy, 11-30 = medium, 31-70 = hard, 70+ = very hard.
- **Traffic Value:** Estimated dollar value of a site's organic traffic if it were paid for via Google Ads. Useful for estimating SEO ROI.

## Semrush

### Comparable Features

| Semrush Tool | Ahrefs Equivalent | Notes |
|-------------|-------------------|-------|
| Domain Overview | Site Explorer | Semrush has more data sources (ads, social) |
| Keyword Magic Tool | Keywords Explorer | Semrush has larger keyword database |
| Backlink Analytics | Site Explorer (backlinks) | Ahrefs has larger backlink index |
| Site Audit | Site Audit | Both are good; Semrush has more checks |
| Position Tracking | Rank Tracker | Similar functionality |
| Keyword Gap | Content Gap | Same concept |
| Link Building Tool | — | Semrush has a built-in outreach workflow |
| Content Marketing Toolkit | Content Explorer | Semrush's is more comprehensive |

### Semrush API

```
Base URL: https://api.semrush.com

# Domain organic search keywords
GET /?type=domain_organic&key=YOUR_KEY&display_limit=100&domain=example.com&database=us&display_filter=%2B%7CPo%7CLt%7C11

# Keyword overview
GET /?type=phrase_all&key=YOUR_KEY&phrase=seo+tools&database=us

# Backlinks overview
GET /analytics/v1/?key=YOUR_KEY&type=backlinks_overview&target=example.com&target_type=root_domain
```

## PageSpeed Insights

### Using It Effectively

**URL:** https://pagespeed.web.dev/

**What it shows:**
1. **Lab data (Lighthouse):** Simulated test from Google's servers
2. **Field data (CrUX):** Real user data from Chrome users (this is what Google uses for ranking)

**Key distinction:** If lab data is good but field data is poor, optimize for your actual users' devices and connections. Lab data tests on a fixed throttled connection; your users may have worse conditions.

### PageSpeed Insights API

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&strategy=mobile&category=performance&key=YOUR_API_KEY

# Strategy: mobile or desktop
# Categories: performance, accessibility, best-practices, seo
```

**Rate limit:** 25,000 queries per day with API key, 2 per second.

### Common Lighthouse Audit Fixes

| Audit | Fix | Impact |
|-------|-----|--------|
| Serve images in next-gen formats | Convert to WebP/AVIF, use `<picture>` element | High (LCP) |
| Eliminate render-blocking resources | Defer non-critical CSS/JS, inline critical CSS | High (LCP) |
| Reduce unused CSS | Use PurgeCSS or Chrome Coverage tool to find unused CSS | Medium |
| Reduce unused JavaScript | Code split, tree shake, lazy load non-critical JS | Medium-High |
| Properly size images | Serve responsive images with srcset | Medium (LCP) |
| Enable text compression | Configure Brotli (preferred) or Gzip on server | Medium |
| Preconnect to required origins | `<link rel="preconnect" href="https://cdn.example.com">` | Low-Medium |
| Avoid enormous network payloads | Compress, optimize, lazy load | Medium |
| Serve static assets with efficient cache policy | Set `Cache-Control: public, max-age=31536000` for static assets | Medium |

## Schema Markup Validation

### Tools

1. **Google Rich Results Test:** https://search.google.com/test/rich-results
   - Tests if your page is eligible for rich results
   - Shows which rich result types are detected
   - Reports errors and warnings specific to Google's requirements

2. **Schema.org Validator:** https://validator.schema.org
   - Validates against the full schema.org specification (broader than Google's requirements)
   - Catches structural errors Google's tool might miss

3. **Google Structured Data Markup Helper:** https://www.google.com/webmasters/markup-helper/
   - GUI tool to generate schema markup by tagging elements on your page
   - Good for beginners, but produces Microdata (JSON-LD is preferred)

### Common Schema Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Missing required field | Required property not included | Check Google's documentation for required vs recommended fields |
| Invalid date format | Using "January 15, 2025" instead of ISO 8601 | Use `2025-01-15T08:00:00+00:00` |
| Image not crawlable | Image URL blocked by robots.txt or requires auth | Ensure image URLs are publicly accessible |
| Review not about the item | Review schema on a non-product/business page | Only use Review/AggregateRating on appropriate entity types |
| Self-referencing issues | @id not matching URL or referencing non-existent entities | Ensure @id values are consistent across your schema graph |

## robots.txt Testing

### Google's robots.txt Tester

**Location:** GSC → Settings → robots.txt (or use URL Inspection for individual URL testing)

**Also test with:**
```bash
# Fetch and check your robots.txt
curl -s https://example.com/robots.txt

# Test if a URL is blocked (using Python robotparser)
python3 -c "
from urllib.robotparser import RobotFileParser
rp = RobotFileParser()
rp.set_url('https://example.com/robots.txt')
rp.read()
print(rp.can_fetch('Googlebot', 'https://example.com/page/'))
"
```

### robots.txt Validation Rules

- Must be at domain root: `https://example.com/robots.txt`
- Must return 200 status code (if 5xx, Google assumes all allowed; if 4xx, assumes all allowed)
- Case-sensitive paths
- Maximum file size: 500KB (Google ignores content beyond this)
- Must be UTF-8 encoded

## Rank Tracking Tools

| Tool | Strengths | Pricing |
|------|-----------|---------|
| **Ahrefs Rank Tracker** | Integrated with Ahrefs data, good SERP features tracking | Included in Ahrefs plans |
| **Semrush Position Tracking** | Daily updates, local tracking, competitor comparison | Included in Semrush plans |
| **AccuRanker** | Fast, accurate, dedicated rank tracker | From $129/mo (1,000 keywords) |
| **SE Ranking** | Budget-friendly, good for agencies | From $52/mo |
| **BrightLocal** | Best for local rank tracking (grid-based) | From $39/mo |
| **SERPstat** | Budget-friendly all-in-one | From $69/mo |

### What to Track

- **Primary keywords** (20-50 most important terms)
- **Long-tail variations** (100-500 supporting terms)
- **Brand keywords** (monitor brand SERP presence)
- **Competitor keywords** (terms they rank for that you target)
- **SERP features** (featured snippets, PAA, local pack presence)
- **Device split** (track mobile and desktop separately)
- **Location-specific** (track from your target geographic areas)

## Free Tools Worth Using

| Tool | What It Does | URL |
|------|-------------|-----|
| **Google Search Console** | Core SEO data from Google | search.google.com/search-console |
| **Google Analytics 4** | Website analytics | analytics.google.com |
| **PageSpeed Insights** | Performance testing | pagespeed.web.dev |
| **Google Rich Results Test** | Schema validation | search.google.com/test/rich-results |
| **Google Trends** | Search trend analysis | trends.google.com |
| **Bing Webmaster Tools** | Bing search data + tools | bing.com/webmasters |
| **Chrome DevTools** | Performance, rendering, network analysis | Built into Chrome (F12) |
| **Lighthouse** | Performance, accessibility, SEO audits | Built into Chrome DevTools |
| **Check My Links** | Find broken links on any page | Chrome extension |
| **Detailed SEO Extension** | Quick on-page SEO checks | Chrome extension |
| **SERP Simulator** | Preview how your title/desc appear in SERPs | mangools.com/free-seo-tools/serp-simulator |
| **AnswerThePublic** | Question-based keyword research | answerthepublic.com |
| **AlsoAsked** | PAA (People Also Ask) mapping | alsoasked.com |
| **XML Sitemaps** | Generate XML sitemaps | xml-sitemaps.com |
