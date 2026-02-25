---
name: content-strategy
description: Develops a comprehensive content strategy including topic cluster architecture, content calendar, content gap analysis, content audit of existing pages, and ROI prioritization
triggers: [content strategy, content calendar, topic cluster, content gap, content audit, pillar page]
tools_required: [web-search, web-crawl, http-request, browse-page, file-write, memory-write, memory-read, memory-list]
---

# Content Strategy Development

When this skill activates, you are developing a comprehensive SEO content strategy. Follow this structured workflow precisely.

## Phase 1: Strategic Foundation

Confirm or retrieve from memory:
1. **Business goals** — revenue targets, lead generation, brand awareness, market expansion
2. **Target audience** — personas, demographics, pain points, search behavior
3. **Current content inventory** — existing blog posts, landing pages, guides, resources
4. **Content capacity** — team size, publishing frequency, budget for content production
5. **Competitive landscape** — top 3-5 content competitors (may differ from business competitors)
6. **Existing keyword research** — check working memory for `keywords:[domain]:*`
7. **Existing competitor data** — check working memory for `competitors:[domain]:*`
8. **Domain authority baseline** — rough assessment of current organic strength

Store strategic inputs in working memory: `strategy:[domain]:foundation`

## Phase 2: Content Audit

### 2.1 Existing Content Inventory
Use `web-crawl` to crawl the client's site and build a content inventory:
- **All content pages** — blog posts, guides, landing pages, resource pages
- **URL structure** — how content is organized (by topic, date, category)
- **Publication dates** — when each piece was published and last updated
- **Content length** — word count estimate for each page
- **Content type** — categorize each as blog post, guide, landing page, tool, etc.

### 2.2 Content Performance Assessment
For each existing content page, assess:
- **Keyword rankings** — use `web-search` to check if the page ranks for its target keyword
- **Content quality** — depth, accuracy, freshness, uniqueness (sample 10-20 key pages)
- **Technical signals** — proper headings, schema markup, internal links, meta tags
- **Conversion elements** — CTAs, lead magnets, product links present

Categorize each content piece:
- **Keep & Optimize** — ranking but underperforming, needs on-page improvements
- **Update & Refresh** — outdated content with existing authority, needs content refresh
- **Consolidate** — multiple thin pages on similar topics, should be merged
- **Prune** — low quality, no rankings, no traffic, cannibalizing other pages
- **Keep As-Is** — performing well, no changes needed

Store content audit in working memory: `strategy:[domain]:content-audit`

### 2.3 Keyword Cannibalization Check
Identify pages competing for the same keywords:
- Use `web-search` for `site:[domain] [keyword]` to find multiple pages targeting the same term
- Flag cannibalization issues where two or more pages split ranking potential
- Recommend consolidation or differentiation for each conflict

## Phase 3: Topic Cluster Architecture

### 3.1 Pillar Topic Identification
Based on keyword research and business goals, identify 5-8 pillar topics:
- Each pillar represents a broad, high-volume topic central to the business
- Each pillar should have enough subtopics to support 10-20 cluster content pieces
- Pillars should cover different funnel stages (awareness, consideration, decision)

### 3.2 Cluster Content Mapping
For each pillar topic, use `web-search` to research and map:
- **Pillar page** — comprehensive, authoritative resource (2000-5000+ words)
- **Cluster pages** — supporting content addressing specific subtopics, questions, and long-tail keywords
- **Internal linking structure** — every cluster page links to the pillar, pillar links to all clusters
- **Content type per cluster** — blog post, how-to guide, comparison, case study, FAQ, tool

Example cluster architecture:

```
Pillar: "Technical SEO" (pillar page)
├── "How to Fix Crawl Errors" (how-to guide)
├── "XML Sitemap Best Practices" (best practices guide)
├── "Core Web Vitals Optimization" (technical guide)
├── "Schema Markup Guide" (comprehensive guide)
├── "Mobile SEO Checklist" (checklist)
├── "Site Speed Optimization" (how-to guide)
├── "JavaScript SEO Guide" (technical guide)
├── "Internal Linking Strategy" (strategy guide)
├── "Log File Analysis Guide" (advanced guide)
└── "Technical SEO Audit Template" (template/tool)
```

### 3.3 Content Gap Analysis
Compare the client's topic coverage against competitors:
- Use `web-crawl` on competitor content hubs to map their topic coverage
- Identify topics competitors cover that the client does not
- Identify topics NO competitor covers well (whitespace opportunities)
- Prioritize gaps by search volume, business relevance, and competitive difficulty

Store topic cluster architecture in working memory: `strategy:[domain]:clusters`

## Phase 4: Content Calendar Development

### 4.1 Publication Prioritization Framework
Score each content opportunity using this framework:

| Factor | Weight | Criteria |
|--------|--------|----------|
| Business Impact | 30% | Revenue potential, lead generation value |
| Keyword Opportunity | 25% | Search volume, ranking difficulty, current position |
| Competitive Gap | 20% | Is this a gap where we can win? How strong is competition? |
| Content Effort | 15% | Word count, research needed, assets required |
| Timeliness | 10% | Seasonal relevance, trending topics, industry events |

Priority tiers:
- **Tier 1 — Publish First**: High impact + low effort, or time-sensitive opportunities
- **Tier 2 — Publish Soon**: High impact + moderate effort, competitive gaps to fill
- **Tier 3 — Scheduled**: Important but can wait, requires significant investment
- **Tier 4 — Backlog**: Nice-to-have content, fill in as capacity allows

### 4.2 Seasonal & Trend Planning
Use `web-search` to identify:
- **Seasonal keywords** — search terms with predictable volume spikes (plan content 2-3 months ahead)
- **Industry events** — conferences, product launches, regulatory changes to create content around
- **Trending topics** — emerging topics gaining search interest in the niche
- **Evergreen vs timely mix** — balance of permanent value content with news/trend content

### 4.3 Monthly Content Calendar
Build a 3-6 month content calendar:
- **Month 1**: Focus on quick wins (optimizing existing content) and pillar page creation
- **Month 2**: Launch first 2-3 topic clusters, begin filling competitive gaps
- **Month 3**: Continue cluster development, publish data-driven/link-worthy content
- **Months 4-6**: Expand to additional pillars, refresh early content, scale what works

For each calendar entry, specify:
- Target keyword and search intent
- Content type and format
- Word count target
- Internal linking targets (which existing pages to connect)
- CTA and conversion goal
- Writer assignment notes (expertise required, research sources)

## Phase 5: Content Operations Framework

### 5.1 Content Production Workflow
Recommend a repeatable content production process:
1. **Brief creation** — use content-brief skill for each piece
2. **Outline approval** — stakeholder review of heading structure and approach
3. **First draft** — writer completes draft following brief
4. **SEO review** — check keyword usage, headings, meta tags, internal links
5. **Editorial review** — quality, accuracy, brand voice compliance
6. **Publication** — publish with proper schema, images, and internal links
7. **Promotion** — distribution plan (social, email, outreach)
8. **Performance tracking** — monitor rankings and traffic after 30/60/90 days

### 5.2 Content Refresh Cadence
Establish a content maintenance schedule:
- **Quarterly**: review top-performing content for freshness opportunities
- **Bi-annually**: audit all content for accuracy, broken links, outdated stats
- **Annually**: full content audit with prune/consolidate/refresh decisions
- **Trigger-based**: refresh when rankings drop, industry changes occur, or competitors publish superior content

### 5.3 KPI Framework
Define measurable success metrics:
- **Organic traffic** — per page and per cluster
- **Keyword rankings** — position tracking for target keywords
- **Organic conversions** — leads, sales, signups from organic traffic
- **Content ROI** — revenue generated vs content production cost
- **Topical authority** — number of keywords ranking per cluster
- **Engagement metrics** — time on page, scroll depth, pages per session

## Phase 6: Report Generation

Generate a comprehensive content strategy document using `file-write`:

```markdown
# Content Strategy
## [Domain] — [Date]

### Executive Summary
[Strategy overview: key themes, estimated traffic potential, resource requirements, timeline]

### Content Audit Summary
- Total content pages: [count]
- Keep & Optimize: [count]
- Update & Refresh: [count]
- Consolidate: [count]
- Prune: [count]
- Cannibalization issues: [count]

### Topic Cluster Architecture
#### Pillar 1: [Topic]
- Pillar page: [title/URL]
- Cluster pages: [count]
- Total estimated search volume: [number]
[Repeat for each pillar]

### Content Gap Analysis
| Topic Gap | Search Volume | Competition | Priority |
|-----------|-------------|-------------|----------|

### Content Calendar (3-6 Months)
#### Month 1: [Theme]
| Week | Content Title | Keyword | Type | Word Count | Priority |
|------|-------------|---------|------|-----------|----------|

#### Month 2: [Theme]
[Same format]

#### Month 3: [Theme]
[Same format]

### Quick Wins (Existing Content Optimization)
| Page | Current Keyword | Action | Expected Impact |
|------|----------------|--------|-----------------|

### Content Refresh Schedule
| Page | Last Updated | Refresh Action | Priority |
|------|-------------|----------------|----------|

### Resource Requirements
- Monthly content volume: [X posts/pages]
- Average word count: [X words]
- Writer time estimate: [X hours/month]
- Supporting assets: [images, infographics, tools needed]

### KPIs & Success Metrics
| Metric | Current Baseline | 3-Month Target | 6-Month Target |
|--------|-----------------|----------------|----------------|

### Appendix: Full Topic Cluster Map
[Complete pillar + cluster content map with keyword assignments]
```

## Phase 7: Memory Update

After completing the strategy:
1. Store strategy summary and pillar topics in working memory: `strategy:[domain]:summary`
2. Store content calendar in working memory for reference by content-brief skill
3. Store content audit results for future comparison (next audit baseline)
4. Store cannibalization issues for tracking resolution
5. Link to keyword research and competitor analysis data for cross-skill reference
