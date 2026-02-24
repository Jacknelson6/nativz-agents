---
name: technical-audit
description: Comprehensive technical SEO audit covering crawlability, indexability, Core Web Vitals, structured data, and site architecture
triggers: [audit, crawl, technical seo, site audit, technical audit, crawlability, indexability]
tools_required: [web-crawl, http-request, screenshot, file-write, stagehand-extract]
---

# Technical SEO Audit

When this skill activates, you are conducting a comprehensive technical SEO audit. Follow this structured workflow precisely.

## Phase 1: Information Gathering

Before crawling anything, confirm or retrieve from memory:
1. **Target URL** — the homepage or specific section to audit
2. **CMS/Framework** — WordPress, Shopify, Next.js, custom? (Check structured memory first)
3. **Known issues** — any specific problems the client has mentioned
4. **Scope** — full site audit or focused audit (e.g., just Core Web Vitals, just indexability)

If this is a returning client, check working memory and structured memory for previous audit findings to track progress.

## Phase 2: Crawl & Data Collection

Execute these checks systematically:

### 2.1 Robots.txt Analysis
- Use `http-request` to fetch `/robots.txt`
- Check for: blocked important paths, missing sitemap reference, overly restrictive rules, crawl-delay directives
- Store findings in working memory: `audit:[domain]:robots`

### 2.2 XML Sitemap Analysis
- Fetch the sitemap (from robots.txt reference or common paths: `/sitemap.xml`, `/sitemap_index.xml`)
- Check: total URL count, lastmod accuracy, format validity, inclusion of important pages, exclusion of non-indexable pages
- Store findings: `audit:[domain]:sitemap`

### 2.3 Crawlability Check
- Use `web-crawl` to crawl the site (start with 50-100 pages for initial assessment)
- Identify: HTTP status codes (301s, 302s, 404s, 500s), redirect chains/loops, orphan pages, crawl depth issues
- Check internal link structure and PageRank flow
- Store findings: `audit:[domain]:crawl`

### 2.4 Indexability Assessment
- Check for `noindex` tags, canonical tags, meta robots directives
- Verify canonical consistency (self-referencing, cross-domain)
- Check for duplicate content signals
- Use `http-request` to verify HTTP headers (X-Robots-Tag)

### 2.5 Core Web Vitals
- Use `screenshot` to capture PageSpeed Insights results or use the PSI API via `http-request`
- Check LCP (<2.5s), INP (<200ms), CLS (<0.1)
- Identify: render-blocking resources, unoptimized images, layout shifts, slow server response
- Store findings: `audit:[domain]:cwv`

### 2.6 Structured Data
- Extract and validate JSON-LD from key pages using `stagehand-extract`
- Check for: valid schema types, required properties, Google rich result eligibility
- Identify opportunities for missing schema (FAQ, HowTo, Product, LocalBusiness, etc.)

### 2.7 Mobile & Rendering
- Check mobile-friendliness
- For JS-heavy sites: verify server-side rendering or pre-rendering is working
- Check viewport meta tag, responsive design signals

### 2.8 Security & Performance
- Check HTTPS implementation (mixed content, HTTP→HTTPS redirects)
- Check HSTS headers
- Check server response times (TTFB)

## Phase 3: Analysis & Prioritization

Categorize all findings into priority tiers:

- **P0 Critical** — Issues causing immediate ranking/indexing damage (noindex on important pages, broken canonicals, site-wide 5xx errors)
- **P1 High** — Issues with significant impact (poor Core Web Vitals, missing structured data on key pages, redirect chains)
- **P2 Medium** — Issues worth fixing but not urgent (suboptimal title tags, missing meta descriptions, minor crawl waste)
- **P3 Low** — Nice-to-have improvements (HTML sitemap, schema for non-rich-result types)

## Phase 4: Report Generation

Generate a comprehensive audit report using `file-write`:

```markdown
# Technical SEO Audit Report
## [Domain] — [Date]

### Executive Summary
[3-5 sentences: overall health, critical issues count, biggest opportunities]

### Critical Issues (P0)
[Each with: description, impact, fix, code/config if applicable]

### High Priority (P1)
[Same format]

### Medium Priority (P2)
[Same format]

### Low Priority (P3)
[Same format]

### Recommendations Timeline
[Quick wins (this week), medium-term (this month), long-term (this quarter)]
```

## Phase 5: Memory Update

After completing the audit:
1. Store key findings in working memory for follow-up
2. Store client-specific facts in structured memory (CMS, known issues, baseline metrics)
3. Note any items that need re-checking in a future audit
