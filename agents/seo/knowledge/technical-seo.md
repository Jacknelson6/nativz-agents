# Technical SEO — Senior Consultant's Playbook

## Crawlability

### How Search Engines Crawl

Googlebot uses a two-phase system: **crawling** (fetching HTML) and **rendering** (executing JavaScript). These happen separately, often hours or days apart. This is critical for JS-heavy sites.

**Crawl Budget** is the number of URLs Google will crawl on your site in a given timeframe. It's determined by:
- **Crawl rate limit:** How fast Google can crawl without overloading your server (controlled by server response times and Googlebot settings in GSC)
- **Crawl demand:** How much Google *wants* to crawl based on popularity, staleness, and site signals

**Crawl budget only matters for sites with 10k+ pages.** Small sites don't need to worry.

### Crawl Budget Killers

| Issue | Impact | Fix |
|-------|--------|-----|
| Faceted navigation generating millions of parameter URLs | Critical — can waste 80%+ of crawl budget | Use `robots.txt` to block faceted paths, implement canonical tags to parent category, use AJAX for filters |
| Infinite scroll without paginated URLs | Pages beyond first load never get crawled | Implement `rel="next/prev"` (deprecated but still useful signal) or better: use `/page/2/`, `/page/3/` URLs that load content server-side |
| Session IDs in URLs | Creates infinite duplicate URLs | Move session IDs to cookies. Never put them in URLs. |
| Calendar widgets generating future date URLs | Creates infinite crawlable URLs | Block via robots.txt or use JavaScript-only calendar with no crawlable links |
| Internal search result pages indexed | Low-quality pages consuming crawl budget | `noindex` search results, block `/search/` or `?s=` in robots.txt |
| Soft 404s | Pages returning 200 but showing "no results" | Return proper 404 status codes, or redirect to relevant parent pages |

### Diagnosing Crawl Issues

**Server Log Analysis** is the gold standard. Tools:
- **Screaming Frog Log Analyzer** (best for most)
- **Botify** (enterprise)
- **Custom ELK stack** (for engineers)

What to look for in logs:
```
# Extract Googlebot hits from Apache/Nginx logs
grep "Googlebot" access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -50
```

Key metrics from logs:
- Hit frequency per URL/section — where is Google spending time?
- Status code distribution — how many 200s vs 301s vs 404s vs 5xx?
- Crawl frequency trends — is Google crawling more or less over time?
- Pages never crawled — orphan pages that Google hasn't discovered

### robots.txt Best Practices

```
# Good robots.txt template
User-agent: *
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /account/
Disallow: /search/
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*&sessionid=

# Allow CSS/JS for rendering
Allow: /wp-content/uploads/
Allow: /assets/

Sitemap: https://example.com/sitemap_index.xml
```

**Critical rules:**
- `Disallow` blocks crawling, NOT indexing. A page can still appear in search if other pages link to it. Use `noindex` to prevent indexing.
- `robots.txt` is case-sensitive for paths
- `Crawl-delay` is respected by Bing but ignored by Google
- Test with Google's robots.txt tester in GSC
- Changes take effect immediately for new crawls but pages already indexed stay until recrawled

### XML Sitemaps

**Structure for large sites:**
```xml
<!-- sitemap_index.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemaps/pages.xml</loc>
    <lastmod>2025-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemaps/blog-1.xml</loc>
    <lastmod>2025-01-20</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemaps/products-1.xml</loc>
    <lastmod>2025-01-22</lastmod>
  </sitemap>
</sitemapindex>
```

**Rules:**
- Max 50,000 URLs per sitemap file, max 50MB uncompressed
- `lastmod` must be accurate (the actual last modification date, not today's date). Inaccurate lastmod trains Google to ignore it.
- `priority` and `changefreq` are deprecated — Google ignores them
- Only include canonical, 200-status, indexable URLs
- Segment sitemaps by content type for easier monitoring in GSC
- Gzip compression is supported: `sitemap.xml.gz`

## Indexability

### Index Control Directives

| Method | Blocks Crawling? | Blocks Indexing? | Use When |
|--------|-----------------|-----------------|----------|
| `robots.txt Disallow` | ✅ | ❌ (can still index via links) | Block crawl budget waste on known low-value sections |
| `<meta name="robots" content="noindex">` | ❌ (must be crawled to be read) | ✅ | Prevent specific pages from appearing in search |
| `X-Robots-Tag: noindex` (HTTP header) | ❌ | ✅ | Same as meta noindex but for non-HTML files (PDFs, images) |
| `Canonical tag` | ❌ | Consolidates (hint) | Tell Google which version of duplicate content to index |
| `301 redirect` | ❌ | Replaces in index | Permanently moved URLs |

### Canonical Tags — Deep Dive

**Self-referencing canonicals:** Every indexable page should point to itself. This prevents parameter pollution and protocol/www variations.

```html
<!-- On https://example.com/shoes/red-sneakers/ -->
<link rel="canonical" href="https://example.com/shoes/red-sneakers/" />
```

**Common canonical mistakes:**
1. **Canonical chains:** A → B → C. Google may ignore them all. Always point to the final canonical directly.
2. **Canonicalizing paginated pages to page 1:** DON'T. Each page has unique content. Either self-canonical each page or use `noindex` on page 2+.
3. **Mixed signals:** Canonical says URL A, but internal links all point to URL B, sitemap contains URL B. Google will choose B.
4. **HTTP/HTTPS or www/non-www mismatches:** Canonical says `https://www.example.com` but site serves on `https://example.com`. Be consistent.
5. **Relative URLs in canonicals:** Always use absolute URLs.

**Cross-domain canonicals** work but Google treats them as a hint, not a directive. Syndicated content should use cross-domain canonicals pointing back to the original.

## Core Web Vitals

### LCP (Largest Contentful Paint) — Target: <2.5s

**What it measures:** Time until the largest above-the-fold element (image, video poster, or text block) is rendered.

**Common causes of poor LCP:**
1. **Slow server response (TTFB >600ms):** Upgrade hosting, implement server-side caching (Varnish, Redis), use a CDN (Cloudflare, Fastly, AWS CloudFront)
2. **Render-blocking resources:** Defer non-critical CSS/JS. Inline critical CSS. Use `<link rel="preload">` for key resources.
3. **Unoptimized hero images:** Use WebP/AVIF, proper sizing (srcset), preload the LCP image:
   ```html
   <link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />
   ```
4. **Client-side rendering:** LCP element built by JavaScript must wait for JS download + parse + execute. Use SSR/SSG.
5. **Web font blocking text rendering:** Use `font-display: swap` and preload critical fonts:
   ```html
   <link rel="preload" as="font" href="/fonts/main.woff2" type="font/woff2" crossorigin />
   ```

### INP (Interaction to Next Paint) — Target: <200ms

Replaced FID in March 2024. Measures responsiveness of ALL interactions throughout the page lifecycle, not just the first one.

**Common causes of poor INP:**
1. **Long tasks (>50ms) on the main thread:** Break up JavaScript execution with `requestIdleCallback`, `setTimeout`, or `scheduler.yield()`
2. **Heavy event handlers:** Debounce scroll/resize handlers, use passive event listeners
3. **Layout thrashing:** Batch DOM reads and writes separately. Use `requestAnimationFrame` for visual updates.
4. **Third-party scripts:** Tag managers, analytics, chat widgets, ad scripts. Audit with Chrome DevTools Performance panel. Delay non-essential third-party scripts.

### CLS (Cumulative Layout Shift) — Target: <0.1

**Common causes:**
1. **Images/videos without dimensions:** Always specify `width` and `height` attributes or use CSS `aspect-ratio`
2. **Dynamically injected content:** Ads, cookie banners, late-loading embeds. Reserve space with CSS `min-height`.
3. **Web fonts causing FOUT:** Use `font-display: optional` for non-critical fonts, `size-adjust` for fallback fonts
4. **Late-loading CSS:** Inline critical CSS, preload stylesheet

### Measuring Core Web Vitals

- **Lab data:** Lighthouse, Chrome DevTools, WebPageTest, PageSpeed Insights
- **Field data (what Google uses for ranking):** Chrome User Experience Report (CrUX) via PageSpeed Insights, GSC Core Web Vitals report, CrUX Dashboard (Data Studio)
- **Real User Monitoring:** Use the `web-vitals` JS library to collect real field data:
  ```javascript
  import {onLCP, onINP, onCLS} from 'web-vitals';
  onLCP(console.log);
  onINP(console.log);
  onCLS(console.log);
  ```

**Important:** Lab data and field data often differ significantly. Google uses 75th percentile field data for ranking. A Lighthouse score of 95 means nothing if your real users on 3G in India have 8-second LCP.

## JavaScript SEO

### The Rendering Gap

Google's rendering pipeline:
1. **Crawl:** Googlebot fetches HTML
2. **Queue:** Page enters rendering queue (can take seconds to weeks)
3. **Render:** WRS (Web Rendering Service) executes JavaScript using a headless Chromium
4. **Index:** Rendered content is indexed

**Problems:**
- Content that requires JavaScript to render may take days or weeks to be indexed
- Some JavaScript patterns break rendering entirely
- Google's WRS doesn't support all browser APIs (no `IntersectionObserver` polyfill issues, no `localStorage`, limited `fetch` error handling)

### SSR vs. CSR vs. SSG vs. ISR

| Approach | SEO Impact | When to Use |
|----------|-----------|-------------|
| **SSR (Server-Side Rendering)** | Excellent — full HTML in initial response | Dynamic content that changes frequently, user-specific content |
| **SSG (Static Site Generation)** | Excellent — pre-built HTML, fastest TTFB | Content that doesn't change often (blogs, docs, marketing pages) |
| **ISR (Incremental Static Regeneration)** | Excellent — best of SSG with freshness | Large sites with frequent-ish updates (e-commerce, news) |
| **CSR (Client-Side Rendering)** | Poor to Moderate — depends on Google rendering | SPAs where SEO isn't primary goal, behind-login apps |
| **Dynamic Rendering** | Workaround — serve pre-rendered HTML to bots | Legacy CSR apps where SSR migration isn't feasible |

### Testing What Google Sees

1. **URL Inspection Tool (GSC):** Shows both the raw HTML and rendered HTML Google sees. Check "View Crawled Page" and "View Tested Page."
2. **`cache:` operator:** `cache:example.com/page` — shows cached version (text-only view reveals what was indexed)
3. **Fetch as Google / Rich Results Test:** Renders the page and shows screenshot + HTML
4. **Compare source vs. rendered:** In Chrome, compare View Source (Ctrl+U) with DevTools Elements panel. The delta is what requires JS rendering.

## Structured Data

### Implementation

Always use **JSON-LD** format (Google's preference). Place in `<head>` or `<body>`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://example.com/author/name"
  },
  "datePublished": "2025-01-15T08:00:00+00:00",
  "dateModified": "2025-01-20T10:30:00+00:00",
  "image": "https://example.com/images/article-hero.jpg",
  "publisher": {
    "@type": "Organization",
    "name": "Example Inc",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
</script>
```

### Schema Types That Trigger Rich Results (as of 2025)

- **Article** → Article rich result (headline, image, date)
- **FAQ** → FAQ accordion in SERPs (declining in frequency since 2023)
- **HowTo** → Step-by-step with images (mobile only, also declining)
- **Product** → Price, availability, reviews in SERPs
- **LocalBusiness** → Knowledge panel, map pack
- **BreadcrumbList** → Breadcrumb trail in SERPs
- **VideoObject** → Video carousel, key moments
- **Review/AggregateRating** → Star ratings
- **Event** → Event listing
- **Recipe** → Recipe carousel
- **SoftwareApplication** → App info
- **JobPosting** → Google for Jobs

### Validation

- **Google Rich Results Test:** https://search.google.com/test/rich-results — shows which rich results are eligible
- **Schema Markup Validator:** https://validator.schema.org — validates against full schema.org spec
- **GSC Enhancements report:** Shows schema errors/warnings at scale across your site

## International SEO

### hreflang Implementation

```html
<!-- In <head> of each page -->
<link rel="alternate" hreflang="en-us" href="https://example.com/page/" />
<link rel="alternate" hreflang="en-gb" href="https://example.co.uk/page/" />
<link rel="alternate" hreflang="es" href="https://example.com/es/page/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/page/" />
```

**Critical rules:**
1. **Return links are required.** If page A references page B, page B MUST reference page A. Missing return links cause Google to ignore hreflang entirely.
2. **Self-referencing is required.** Each page must include itself in the hreflang set.
3. **Use correct codes:** Language is ISO 639-1 (`en`, `es`, `de`). Region is ISO 3166-1 Alpha 2 (`US`, `GB`, `MX`). Language is required, region is optional. `en-US` is wrong — must be `en-us` (lowercase).
4. **x-default** for your fallback/language selector page.

**For large sites (1000+ locale pages),** implement hreflang in XML sitemaps instead of HTML tags:
```xml
<url>
  <loc>https://example.com/page/</loc>
  <xhtml:link rel="alternate" hreflang="en-us" href="https://example.com/page/" />
  <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/page/" />
</url>
```

### URL Structure Strategy

| Structure | Pros | Cons |
|-----------|------|------|
| **ccTLDs** (example.de) | Strong geo-signal, user trust | Expensive, separate domains to build authority for |
| **Subdomains** (de.example.com) | Easy setup, separate hosting possible | Weaker geo-signal, authority doesn't fully transfer |
| **Subdirectories** (example.com/de/) | Shared domain authority, easiest management | Weaker geo-signal than ccTLD, single server location |

**Recommendation for most businesses:** Subdirectories. You keep all link equity on one domain. Only use ccTLDs if you have the resources and the market justifies it.

## Mobile-First Indexing

Google indexes the mobile version of all sites. This means:

1. **Mobile content IS your content.** If you hide content on mobile (accordion, tabs, read-more), it still gets indexed, but make sure it's in the DOM on mobile.
2. **Structured data must be on mobile version.** If your desktop has schema but mobile doesn't, Google won't see it.
3. **Mobile page speed matters more than desktop.** Optimize for 3G/4G connections.
4. **Responsive design is the recommended approach.** Separate mobile URLs (m.example.com) create maintenance overhead and hreflang complexity.

## HTTPS & Security

- HTTPS is a confirmed ranking signal (lightweight)
- Mixed content (HTTP resources on HTTPS pages) causes browser warnings and can break rendering
- HSTS headers prevent SSL stripping attacks and tell browsers to always use HTTPS
- Check certificate validity, redirect all HTTP to HTTPS via 301

## Redirect Chains & Migration

### Redirect Types

| Code | Type | Use Case | Passes PageRank? |
|------|------|----------|-----------------|
| 301 | Permanent | URL permanently moved | Yes (with slight dampening) |
| 302 | Temporary (Found) | Temporary move, A/B test | Historically no, now Google treats similarly to 301 if long-lived |
| 307 | Temporary Redirect | Same as 302 but preserves HTTP method | Same as 302 |
| 308 | Permanent Redirect | Same as 301 but preserves HTTP method | Same as 301 |
| Meta refresh | — | Avoid for SEO | Partial, slow |
| JavaScript redirect | — | Avoid for SEO | Unreliable |

### Site Migration Checklist

1. **Pre-migration:** Full crawl of old site (Screaming Frog), export all URLs, rankings, and backlinks. Map every old URL to new URL.
2. **Redirect map:** 1:1 redirects for every old URL to its closest equivalent new URL. Bulk test with Screaming Frog list mode.
3. **Update internal links:** Point to new URLs directly. Don't rely on redirects for internal linking.
4. **Update sitemaps:** New sitemap with new URLs only. Submit to GSC.
5. **Monitor:** Track crawl stats, indexed pages, organic traffic daily for 4-6 weeks post-migration. Expect a temporary traffic dip (2-4 weeks is normal, 30% dip is not unusual).
6. **GSC:** Add and verify new property. Use Change of Address tool if changing domains.
7. **Keep old redirects live for at least 1 year.** Google says permanently, but minimum 1 year.
