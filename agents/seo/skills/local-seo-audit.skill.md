---
name: local-seo-audit
description: Comprehensive local SEO audit covering Google Business Profile optimization, local citations, NAP consistency, location pages, local schema markup, and review analysis
triggers: [local seo, gbp, google business, local audit, citations, nap]
tools_required: [web-search, web-crawl, http-request, browse-page, browse-page, screenshot, file-write, memory-write, memory-read]
---

# Local SEO Audit

When this skill activates, you are conducting a local SEO audit for a business that serves customers in specific geographic areas. Follow this structured workflow precisely.

## Phase 1: Business Information Gathering

Confirm or retrieve from memory:
1. **Business name** — exact legal/trading name
2. **Business address(es)** — all physical locations
3. **Phone number(s)** — primary and location-specific numbers
4. **Website URL** — main site and any location-specific pages
5. **Business categories** — primary and secondary categories
6. **Service area** — neighborhoods, cities, regions served
7. **Business type** — brick-and-mortar, service-area business, or hybrid
8. **Hours of operation** — standard and special hours
9. **Key local keywords** — "[service] + [city]" variations the client targets

Store business info in working memory: `local:[business-name]:info`

## Phase 2: Google Business Profile Analysis

### 2.1 GBP Listing Discovery & Assessment
Use `web-search` for the business name to find:
- Does a Google Business Profile appear in search results?
- Is the knowledge panel complete and accurate?
- Are there duplicate listings for the same business?

Use `browse-page` and `browse-page` on Google Maps/Search results to assess:
- **Business name** — matches official name (no keyword stuffing)
- **Address** — correct and consistent with website
- **Phone number** — correct, local number preferred over toll-free
- **Website link** — points to correct page (homepage or location page)
- **Categories** — primary category accuracy, secondary categories utilized
- **Business description** — complete, keyword-rich, within 750 chars
- **Hours** — accurate, including special hours for holidays
- **Attributes** — relevant attributes selected (wheelchair accessible, Wi-Fi, etc.)

Store GBP findings in working memory: `local:[business-name]:gbp`

### 2.2 GBP Content & Engagement
Check for:
- **Photos** — quantity, quality, recency, categories (interior, exterior, team, products)
- **Google Posts** — frequency, type (updates, offers, events), engagement
- **Q&A section** — questions answered, common themes
- **Products/Services** — listed and categorized in GBP
- **Messaging** — enabled/disabled

### 2.3 Review Analysis
Use `browse-page` to analyze the GBP review profile:
- **Total review count** vs top local competitors
- **Average star rating** — overall and recent trend (improving/declining)
- **Review velocity** — approximate reviews per month
- **Review recency** — date of most recent review
- **Review content themes** — common praise and complaints (sentiment analysis)
- **Owner responses** — response rate, response time, quality of responses
- **Review keywords** — do customers naturally mention target keywords/services?

Store review analysis in working memory: `local:[business-name]:reviews`

## Phase 3: NAP Consistency Audit

### 3.1 Website NAP Check
Use `web-crawl` on the client's website to verify:
- NAP visible on every page (typically header/footer)
- NAP format consistent across all pages
- NAP matches GBP listing exactly
- Local business schema markup includes correct NAP
- Contact page has complete, accurate information
- Embedded Google Map with correct pin location

### 3.2 Citation Audit
Use `web-search` to find existing citations on major directories:
- **Tier 1**: Google Business Profile, Apple Maps, Bing Places, Yelp, Facebook
- **Tier 2**: Industry-specific directories (e.g., Avvo for lawyers, Healthgrades for doctors)
- **Tier 3**: General directories (YellowPages, BBB, Chamber of Commerce, Foursquare)
- **Tier 4**: Data aggregators (Neustar/Localeze, Factual, Infogroup)

For each citation found, check:
- Business name — exact match?
- Address — format and accuracy match?
- Phone number — correct?
- Website URL — correct and not broken?
- Categories — appropriate?
- Hours — accurate?

Flag all inconsistencies for correction.

Store citation audit in working memory: `local:[business-name]:citations`

### 3.3 Missing Citation Opportunities
Identify high-authority directories where the business is NOT listed:
- General local directories
- Industry-specific directories
- Local/regional directories (city-specific, state-specific)
- Association memberships and professional organizations

## Phase 4: Website Local SEO Analysis

### 4.1 Location Pages
If the business has multiple locations, assess each location page for:
- **Unique content** — not duplicated across locations (minimum 300-500 unique words)
- **Location-specific keywords** — city, neighborhood, landmarks in content
- **NAP for that location** — prominently displayed
- **Embedded map** — showing that specific location
- **Location-specific testimonials** — reviews from that area
- **Driving directions** — from major landmarks or highways
- **Service area description** — neighborhoods and areas served
- **Local images** — photos of that specific location

### 4.2 Local Schema Markup
Use `browse-page` to check for JSON-LD structured data:
- **LocalBusiness schema** (or more specific subtype: Restaurant, Dentist, etc.)
- Required properties: name, address, telephone, url, openingHours
- Recommended properties: geo (lat/long), priceRange, image, aggregateRating
- **Multiple locations**: separate LocalBusiness schema per location
- **Service schema**: for services offered at each location

Provide corrected or net-new JSON-LD code where missing or incomplete.

### 4.3 Local Content Assessment
Evaluate local content signals:
- **Local landing pages** — "[service] in [city]" pages for each target market
- **Blog/resource content** — locally relevant content (local events, news, guides)
- **About page** — local history, community involvement, team bios
- **Testimonial pages** — location-specific reviews and case studies
- **Service area pages** — pages for each neighborhood/suburb served

### 4.4 Mobile Experience
Use `screenshot` to assess mobile experience:
- Click-to-call functionality working
- Map embed loads properly on mobile
- Address is copy-friendly
- Forms are mobile-optimized
- Page load speed on mobile devices

## Phase 5: Local Link Building Assessment

### 5.1 Local Link Profile
Use `web-search` to identify existing local links:
- Local news mentions
- Chamber of Commerce listings
- Sponsorship acknowledgments (sports teams, events, charities)
- Local business association memberships
- Guest posts on local blogs

### 5.2 Local Link Opportunities
Identify buildable local links:
- Local events to sponsor or participate in
- Local charities or nonprofits for partnerships
- Local business groups and networking organizations
- Local media outlets for PR opportunities
- Local universities or schools for sponsorship or speaking

## Phase 6: Competitive Local Analysis

### 6.1 Local Pack Competitors
Use `web-search` for top local keywords ("[service] [city]") to identify:
- Which businesses appear in the Local Pack (3-pack)
- Their review counts and ratings vs the client
- Their GBP completeness and optimization level
- Their proximity to searcher (centroid of city)

### 6.2 Competitor Benchmarking
For each local pack competitor, compare:
- Review count and rating
- Citation volume and consistency
- Website local optimization quality
- Content depth on location/service pages
- Schema markup implementation

## Phase 7: Report Generation

Generate a comprehensive local SEO audit report using `file-write`:

```markdown
# Local SEO Audit Report
## [Business Name] — [Date]

### Executive Summary
[Overall local SEO health score, top 3 priorities, biggest opportunities]

### Google Business Profile Audit
| Element | Status | Action Required |
|---------|--------|----------------|
| Name | [OK/Issue] | [action] |
| Address | [OK/Issue] | [action] |
| Phone | [OK/Issue] | [action] |
| Categories | [OK/Issue] | [action] |
| Description | [OK/Issue] | [action] |
| Photos | [OK/Issue] | [action] |
| Posts | [OK/Issue] | [action] |
| Reviews | [count, rating] | [action] |

### Review Strategy
[Current review metrics, competitor comparison, response strategy recommendations]

### NAP Consistency Report
| Directory | Name | Address | Phone | Status |
|-----------|------|---------|-------|--------|
[All citations found with consistency status]

### Missing Citations
[Priority directories where listings should be created]

### Website Local SEO
[Location page audit results, schema markup findings, local content assessment]

### Local Competition Snapshot
| Metric | [Client] | [Competitor 1] | [Competitor 2] | [Competitor 3] |
|--------|----------|----------------|----------------|----------------|
| Reviews | | | | |
| Rating | | | | |
| Citations | | | | |

### Recommended Action Plan
#### Week 1: Quick Wins
[GBP optimization, NAP corrections]
#### Month 1: Foundation
[Citation building, schema implementation, review strategy launch]
#### Months 2-3: Growth
[Local content creation, link building, ongoing review generation]
```

## Phase 8: Memory Update

After completing the audit:
1. Store business NAP and GBP status in working memory: `local:[business-name]:summary`
2. Store citation list for ongoing monitoring
3. Store competitor review benchmarks for future comparison
4. Note any seasonal local SEO opportunities (local events, holidays)
