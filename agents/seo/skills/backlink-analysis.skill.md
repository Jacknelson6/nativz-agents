---
name: backlink-analysis
description: Analyzes a site's backlink profile including referring domains, anchor text distribution, link quality signals, toxic link detection, and competitor link gap analysis
triggers: [backlink, link building, link profile, referring domain, anchor text, link gap]
tools_required: [web-search, web-crawl, http-request, browse-page, file-write, memory-write, memory-read]
---

# Backlink Analysis

When this skill activates, you are analyzing a site's backlink profile and developing link building recommendations. Follow this structured workflow precisely.

## Phase 1: Context & Objectives

Confirm or retrieve from memory:
1. **Target domain** — the site whose backlink profile is being analyzed
2. **Key competitors** — 3-5 competing domains for link gap analysis
3. **Target keywords** — keywords the site wants to rank for (affects anchor text analysis)
4. **Industry/niche** — to understand typical link patterns in the space
5. **Link building history** — any known past link building efforts (guest posts, PR, etc.)
6. **Goals** — improve authority, recover from penalty, build links for specific pages, or general audit

Check working memory for existing competitor analysis data: `competitors:[domain]:*`

## Phase 2: Current Backlink Profile Discovery

### 2.1 Link Signal Discovery
Since full backlink databases require paid tools, use available methods to assess link profile:

Use `web-search` with these queries to discover backlinks:
- `link:[domain]` — direct link search
- `"[domain]" -site:[domain]` — mentions of the domain on other sites
- `"[brand name]" -site:[domain]` — brand mentions that may include links
- `inurl:[domain]` — pages that reference the domain in their URL
- `"[exact page URL]"` — pages linking to or mentioning specific URLs

For each discovered linking page, use `http-request` or `web-crawl` to verify:
- The link is still live (not removed)
- The link is dofollow vs nofollow/sponsored/ugc
- The linking page is indexed and accessible
- The context around the link (editorial, sidebar, footer, comment)

Store discovered backlinks in working memory: `backlinks:[domain]:profile`

### 2.2 Referring Domain Categorization
Categorize each discovered referring domain by:
- **Domain type**: news/media, blog, directory, forum, government (.gov), educational (.edu), industry resource, social media
- **Relevance**: highly relevant to niche, somewhat relevant, or off-topic
- **Estimated authority**: based on domain age, content quality, and apparent traffic
- **Link placement**: editorial/contextual, sidebar/footer, resource page, guest post bio
- **Geographic relevance**: local, national, international

### 2.3 Anchor Text Distribution Analysis
Compile and analyze anchor text patterns:
- **Branded anchors** — "[brand name]", "[domain.com]" (healthy: 30-50% of profile)
- **Exact match keyword anchors** — "[target keyword]" (healthy: <5% to avoid over-optimization)
- **Partial match anchors** — phrases containing target keyword (healthy: 10-20%)
- **URL anchors** — naked URLs like "https://domain.com/page" (healthy: 10-20%)
- **Generic anchors** — "click here", "read more", "this article" (healthy: 5-15%)
- **Image anchors** — empty anchor (from image links)
- **Misc/natural anchors** — brand + keyword, long descriptive phrases

Flag any over-optimization signals:
- Excessive exact match keyword anchors (>10%)
- Repetitive anchor patterns across multiple domains
- Anchor text distribution that looks manipulated vs natural

Store anchor text analysis in working memory: `backlinks:[domain]:anchors`

## Phase 3: Link Quality Assessment

### 3.1 Quality Scoring Framework
For each discovered backlink, assess quality on these dimensions:

| Signal | Good | Neutral | Toxic |
|--------|------|---------|-------|
| Relevance | Same niche/topic | General authority site | Completely unrelated |
| Context | Editorial mention in content | Resource list | Sitewide footer/sidebar |
| Domain quality | Established, real traffic | Moderate authority | Spammy, thin, PBN signals |
| Link neighborhood | Clean outbound links | Mixed | Links to gambling, pharma, etc. |
| Traffic | Sends referral traffic | Some organic visibility | No traffic, deindexed |
| Anchor text | Natural, varied | Branded/generic | Exact match keyword |

### 3.2 Toxic Link Identification
Flag potentially toxic backlinks exhibiting:
- Links from known link networks or PBN (private blog network) patterns
- Links from pages with excessive outbound links (>100 external links)
- Links from foreign-language spam sites unrelated to the business
- Links with manipulative anchor text (exact match keyword from low-quality site)
- Links from hacked pages or malware-infected domains
- Links from link farms, article directories, or automated comment spam
- Sudden spikes in links from similar low-quality domains

For each flagged toxic link, recommend:
- **Monitor**: questionable but not clearly harmful
- **Disavow**: clearly toxic and potentially damaging
- **Remove**: attempt outreach to request removal before disavowing

### 3.3 Link Velocity Analysis
Assess the rate of link acquisition over time:
- Are new links being acquired steadily or in bursts?
- Has link acquisition slowed or stopped?
- Are links being lost (pages removed, domains expired)?
- Does the velocity pattern look natural or manipulated?

## Phase 4: Competitor Link Gap Analysis

### 4.1 Competitor Backlink Discovery
For each competitor (3-5 domains), use `web-search` to discover their backlinks:
- `"[competitor-domain]" -site:[competitor-domain]` — external mentions
- `"[competitor brand]" -site:[competitor-domain]` — brand mentions
- Search for competitor content titles to find who links to their best content

### 4.2 Link Gap Identification
Compare the client's backlink profile to competitors:
- **Domains linking to competitors but NOT the client** — these are acquisition targets
- **Domains linking to multiple competitors** — highest priority targets (proven they link in niche)
- **Domains linking only to the client** — competitive advantages to protect
- **Link types competitors have that client lacks** — e.g., .edu links, news mentions, resource page links

### 4.3 Link Opportunity Classification
Categorize competitor link sources by acquisition difficulty:
- **Easy**: directories, resource pages that accept submissions, guest post targets
- **Medium**: editorial mentions requiring outreach, broken link opportunities
- **Hard**: natural editorial links from high-authority publications, .gov/.edu links
- **Replicable**: links from strategies the client can replicate (tools, data, guides)
- **Non-replicable**: brand mentions, partnerships specific to the competitor

Store link gap analysis in working memory: `backlinks:[domain]:link-gaps`

## Phase 5: Link Building Opportunity Assessment

### 5.1 Linkable Asset Audit
Evaluate the client's existing content for link-worthiness:
- **Original research/data** — surveys, studies, industry reports (highest link potential)
- **Comprehensive guides** — pillar content, ultimate guides, definitive resources
- **Free tools/calculators** — interactive tools that solve a user problem
- **Infographics/visual assets** — shareable visual content
- **Templates/downloads** — practical resources others would reference
- **Expert roundups/interviews** — content featuring industry figures

Use `web-crawl` on the client's site to identify existing content that could attract links with promotion.

### 5.2 Content Gap for Link Building
Identify content the client should create specifically for link acquisition:
- Topics that competitors earned links for but client has no content on
- Data or research topics in the niche that lack authoritative coverage
- Tool or calculator ideas that would serve the target audience
- Visual content opportunities (industry state reports, benchmark studies)

### 5.3 Outreach Target Identification
Build lists of potential link sources:
- **Resource pages**: use `web-search` for "[niche] + resources", "[topic] + useful links"
- **Broken link opportunities**: find competitor 404 pages that had inbound links
- **Guest posting targets**: sites in the niche that accept contributor content
- **HARO/journalist sources**: publications covering the niche that need expert sources
- **Unlinked brand mentions**: pages mentioning the brand without linking

## Phase 6: Report Generation

Generate a comprehensive backlink analysis report using `file-write`:

```markdown
# Backlink Analysis Report
## [Domain] — [Date]

### Executive Summary
[Overall link profile health, key strengths, critical issues, top opportunities]

### Backlink Profile Overview
- **Discovered Referring Domains**: [count]
- **Total Discovered Backlinks**: [count]
- **Dofollow vs Nofollow Ratio**: [ratio]
- **Link Quality Distribution**: [high/medium/low/toxic counts]

### Anchor Text Distribution
| Anchor Type | Percentage | Status |
|-------------|-----------|--------|
| Branded | X% | [Healthy/Concern] |
| Exact Match | X% | [Healthy/Concern] |
| Partial Match | X% | [Healthy/Concern] |
| URL | X% | [Healthy/Concern] |
| Generic | X% | [Healthy/Concern] |

### Top Quality Backlinks
| Linking Domain | Link Type | Anchor Text | Quality Score |
|---------------|-----------|-------------|---------------|

### Toxic Link Report
| Linking Domain | Toxic Signals | Recommendation |
|---------------|---------------|----------------|
[Monitor / Disavow / Remove for each]

### Competitor Link Gap
| Domain | Links to Comp 1 | Links to Comp 2 | Links to Client | Priority |
|--------|----------------|----------------|-----------------|----------|

### Link Building Opportunities
#### High Priority (Easy + High Impact)
[Resource page submissions, directory listings, broken link replacements]

#### Medium Priority (Moderate Effort)
[Guest posting targets, unlinked mention outreach, content partnerships]

#### Strategic Investments (High Effort + High Reward)
[Original research, tool creation, digital PR campaigns]

### Recommended Link Building Strategy
#### Month 1: Foundation
[Citation cleanup, easy directory submissions, unlinked mention outreach]
#### Months 2-3: Content-Driven
[Linkable asset creation, guest posting campaign launch]
#### Months 4-6: Authority Building
[Digital PR, original research, strategic partnerships]
```

## Phase 7: Memory Update

After completing the analysis:
1. Store backlink profile summary in working memory: `backlinks:[domain]:summary`
2. Store toxic link list for ongoing monitoring and disavow file maintenance
3. Store link gap targets for use in content strategy and link building campaigns
4. Store anchor text distribution baseline for future comparison
5. Note any urgent issues (toxic link spikes, lost high-value links) requiring immediate action
