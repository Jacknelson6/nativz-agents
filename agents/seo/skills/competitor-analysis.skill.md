---
name: competitor-analysis
description: Full competitive SEO analysis comparing a target site against competitors across content, technical SEO, backlinks, keywords, and content strategy dimensions
triggers: [competitor, competitive analysis, compare sites, competitor gap]
tools_required: [web-crawl, web-search, http-request, browse-page, screenshot, file-write, memory-write, memory-read]
---

# Competitor SEO Analysis

When this skill activates, you are conducting a comprehensive competitive SEO analysis. Follow this structured workflow precisely.

## Phase 1: Define the Competitive Landscape

Confirm or retrieve from memory:
1. **Client site** — the domain being analyzed
2. **Known competitors** — direct business competitors the client is aware of
3. **Industry/niche** — to identify organic search competitors that may differ from business competitors
4. **Target keywords** — primary keywords the client wants to rank for
5. **Geographic focus** — market-specific competition (US, UK, local, global)
6. **Business model** — e-commerce, SaaS, publisher, agency, local service (affects comparison criteria)

### 1.1 Discover Organic Competitors
Use `web-search` for 5-10 of the client's target keywords to identify:
- Which domains consistently rank in the top 10
- Domains that appear across multiple keyword categories
- Rank competitors by frequency of appearance

Produce a final list of 3-5 primary organic competitors for deep analysis.

Store competitor list in working memory: `competitors:[domain]:list`

## Phase 2: Domain-Level Comparison

### 2.1 Site Size & Structure
For each competitor, use `web-crawl` and `http-request` to assess:
- **Site size estimate** — crawl depth, sitemap URL count
- **Site structure** — URL hierarchy, content organization pattern
- **Content types** — blog, resource center, tools, landing pages, guides
- **CMS/technology** — identify via HTML signatures, headers, meta generators

### 2.2 Technical SEO Baseline
For each competitor, check:
- **Page speed** — use `http-request` against PageSpeed Insights API or extract via `browse-page`
- **Mobile friendliness** — responsive design signals
- **HTTPS** — proper implementation
- **Core Web Vitals** — LCP, INP, CLS benchmarks
- **Structured data** — schema types implemented
- **Robots.txt & Sitemap** — crawl directives and sitemap completeness

Use `screenshot` to capture homepage and key page layouts for visual comparison.

Store technical comparison in working memory: `competitors:[domain]:technical`

### 2.3 Content Volume & Quality Assessment
For each competitor, analyze:
- **Blog/content hub** — total post count estimate, publishing frequency
- **Content depth** — average word count on key pages (sample 5-10 pages each)
- **Content freshness** — publication dates, update frequency
- **Content types** — articles, guides, videos, tools, templates, calculators
- **Topical authority** — how thoroughly do they cover their core topics

## Phase 3: Keyword Gap Analysis

### 3.1 Keyword Overlap Discovery
Use `web-search` across a broad set of industry keywords to map:
- **Keywords the client ranks for** but competitors don't (client advantages)
- **Keywords competitors rank for** but the client doesn't (gaps/opportunities)
- **Keywords all parties rank for** (battleground terms)
- **Keywords no one ranks well for** (whitespace opportunities)

### 3.2 SERP Feature Comparison
For each major keyword category, note:
- Which competitor captures featured snippets
- Which competitor appears in PAA answers
- Which competitor has rich results (FAQ, HowTo, Product, Review)
- Which competitor appears in image/video results

### 3.3 Content Gap by Topic
Map competitor content to topic clusters:
- Identify topic areas where competitors have extensive content and the client has none
- Identify topics the client covers better than competitors
- Find under-served topics with opportunity for all parties

Store keyword gap analysis in working memory: `competitors:[domain]:keyword-gaps`

## Phase 4: Content Strategy Comparison

### 4.1 Content Themes & Pillars
For each competitor, identify:
- **Core pillar topics** — what are their 3-5 main content pillars?
- **Content hubs** — how are they organized (by topic, by type, by audience)?
- **Top-performing content** — pages that rank for the most keywords
- **Content distribution** — percentage of blog vs landing pages vs guides

### 4.2 Link-Worthy Content Identification
Identify competitor content that likely attracts backlinks:
- Original research and data studies
- Free tools and calculators
- Comprehensive guides (skyscraper content)
- Infographics and visual assets
- Templates and downloadable resources

### 4.3 Publishing Cadence & Freshness
- Estimate monthly publishing volume for each competitor
- Check content update patterns (do they refresh old content?)
- Identify seasonal content strategies

## Phase 5: Backlink Profile Comparison

### 5.1 Link Signal Estimation
While full backlink data requires paid tools, estimate link authority by:
- Use `web-search` for `link:[competitor-domain]` and site mentions
- Check footer/sidebar links on industry resource pages
- Analyze content that likely attracts links (original research, tools, guides)
- Check if competitors are listed on industry directories or resource pages

### 5.2 Link Building Strategy Inference
Based on observable signals, estimate each competitor's link building approach:
- **Content marketing** — earning links through quality content
- **Digital PR** — news coverage, press releases, journalist mentions
- **Resource link building** — appearing on curated resource lists
- **Guest posting** — author bylines on external sites
- **Partnerships** — co-marketing, sponsorships, associations

## Phase 6: Strengths, Weaknesses & Opportunities

For each competitor, compile:

### Strengths (Where they beat the client)
- Specific areas where the competitor outperforms
- Content topics they own with superior coverage
- Technical advantages they hold

### Weaknesses (Where the client can win)
- Gaps in their content coverage
- Technical SEO issues observed
- Outdated content that hasn't been refreshed
- Missing schema or SERP feature optimization
- Poor UX or mobile experience

### Opportunities (Actions the client should take)
- Quick wins: keywords where the client is close to outranking them
- Content gaps to fill with superior content
- Technical improvements to gain competitive edge
- SERP features to capture

## Phase 7: Report Generation

Generate a comprehensive competitor analysis report using `file-write`:

```markdown
# Competitive SEO Analysis Report
## [Client Domain] vs Competitors — [Date]

### Executive Summary
[Key findings: biggest opportunities, primary threats, recommended priorities]

### Competitor Overview
| Metric | [Client] | [Competitor 1] | [Competitor 2] | [Competitor 3] |
|--------|----------|----------------|----------------|----------------|
| Est. Site Size | | | | |
| Content Hub Size | | | | |
| Publishing Freq. | | | | |
| Schema Types | | | | |
| Mobile Score | | | | |

### Keyword Gap Analysis
#### Keywords to Target (Competitor Wins)
| Keyword | [Comp 1] Rank | [Comp 2] Rank | Client Rank | Priority |
|---------|-------------|-------------|-------------|----------|

#### Keywords to Defend (Client Wins)
| Keyword | Client Rank | Closest Competitor | Threat Level |
|---------|-------------|-------------------|-------------|

### Content Strategy Comparison
[Detailed breakdown of each competitor's content approach]

### Technical SEO Comparison
[Side-by-side technical metrics]

### Competitive Advantages & Vulnerabilities
[SWOT-style analysis for the client relative to competitors]

### Recommended Action Plan
#### Immediate (This Month)
[Quick wins and defensive moves]
#### Medium-Term (This Quarter)
[Content creation and optimization priorities]
#### Long-Term (6-12 Months)
[Strategic investments in content, links, and technical SEO]
```

## Phase 8: Memory Update

After completing the analysis:
1. Store competitor list and key metrics in working memory: `competitors:[domain]:summary`
2. Store keyword gap data for use in keyword research and content strategy skills
3. Store competitor weaknesses for use in content brief generation
4. Note any time-sensitive competitive threats requiring urgent action
