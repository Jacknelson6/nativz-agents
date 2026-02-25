---
name: keyword-research
description: Comprehensive keyword research including opportunity identification, competitive gap analysis, and content mapping
triggers: [keyword, search volume, ranking, keyword research, keyword gap, search intent, SERP analysis]
tools_required: [web-search, http-request, file-write, browse-page]
---

# Keyword Research

When this skill activates, you are conducting keyword research. Follow this structured workflow.

## Phase 1: Context & Goals

Confirm or retrieve from memory:
1. **Business type** — e-commerce, SaaS, local service, publisher, etc.
2. **Target market** — geographic focus, language
3. **Current rankings** — any existing keyword data or GSC access
4. **Competitors** — top 3-5 organic competitors (may differ from business competitors)
5. **Content capacity** — how much content can the team produce per month?
6. **Revenue model** — how does organic traffic convert to revenue?

## Phase 2: Seed Keyword Expansion

### 2.1 Brainstorm Seed Keywords
Start with the client's core products/services and expand:
- Product/service terms
- Problem/solution terms (what problems do their customers search for?)
- Competitor brand terms (for analysis, not targeting)
- Industry terms and jargon
- Question-based queries ("how to...", "what is...", "best...")

### 2.2 SERP Analysis
For each major seed keyword, use `web-search` to analyze the current SERP:
- What content types rank? (blog posts, product pages, videos, tools)
- What SERP features appear? (featured snippets, PAA, local pack, images, videos)
- What's the content depth/length of ranking pages?
- What's the search intent? (informational, commercial, transactional, navigational)

Store intent classifications in working memory: `keywords:[domain]:intent-map`

### 2.3 Competitive Gap Analysis
Use `web-search` to research competitors:
- What keywords do competitors rank for that the client doesn't?
- What content do competitors have that the client lacks?
- Where are competitors weak (low DR pages ranking, thin content)?

## Phase 3: Keyword Categorization

Organize keywords by:

### Search Intent
- **Informational** — "how to optimize meta tags", "what is schema markup"
- **Commercial Investigation** — "best SEO tools 2026", "ahrefs vs semrush"
- **Transactional** — "buy SEO audit", "SEO agency pricing"
- **Navigational** — "google search console login"

### Funnel Stage
- **Top of Funnel (TOFU)** — Awareness, educational content
- **Middle of Funnel (MOFU)** — Consideration, comparison content
- **Bottom of Funnel (BOFU)** — Decision, conversion-focused content

### Topic Clusters
Group related keywords into clusters with:
- **Pillar keyword** — broad, high-volume term
- **Supporting keywords** — specific, long-tail variations
- **Content type recommendation** — what format best serves this cluster

## Phase 4: Prioritization Framework

Score each keyword opportunity:

| Factor | Weight | Scoring |
|--------|--------|---------|
| Search Volume | 25% | Relative volume in niche |
| Keyword Difficulty | 25% | Based on competing pages' authority |
| Business Relevance | 30% | Direct revenue potential |
| Quick Win Potential | 20% | Current ranking position, existing content |

Priority categories:
- **Quick Wins** — Already ranking 5-20, need optimization to push to top 3
- **Low Hanging Fruit** — Low difficulty + good volume + high relevance
- **Strategic Investments** — High difficulty but high reward (6-12 month play)
- **Long-Tail Opportunities** — Lower volume but very high intent + easy to rank

## Phase 5: Content Mapping

For each priority keyword cluster, recommend:
1. **Target page** — existing page to optimize OR new page to create
2. **Content type** — blog post, landing page, guide, tool, video
3. **Content outline** — H1, key H2s, word count range, unique angle
4. **Internal linking** — which existing pages should link to/from this content
5. **Schema opportunity** — FAQ, HowTo, Article, etc.

## Phase 6: Output & Deliverable

Generate a keyword research report using `file-write`:

```markdown
# Keyword Research Report
## [Client/Domain] — [Date]

### Executive Summary
[Top opportunities, estimated traffic potential, recommended priorities]

### Quick Wins (Optimize Existing Content)
| Keyword | Current Position | Volume | Recommended Action |
|---------|-----------------|--------|-------------------|

### New Content Opportunities
| Keyword Cluster | Total Volume | Difficulty | Content Type | Priority |
|----------------|-------------|------------|--------------|----------|

### Topic Cluster Architecture
[Visual representation of pillar pages and supporting content]

### Content Calendar Recommendations
[Suggested publishing sequence based on priority and seasonality]

### Competitive Gaps
[Keywords competitors rank for that represent opportunities]
```

## Phase 7: Memory Update

After completing research:
1. Store the keyword strategy summary in working memory
2. Store client's target keywords and intent map in structured memory
3. Note seasonal keywords that need timing-specific action
