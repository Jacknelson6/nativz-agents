---
name: content-brief
description: Generates comprehensive content briefs from a target keyword by analyzing SERPs, competing content, and producing detailed outlines with word count targets, entities, and questions to answer
triggers: [content brief, writing brief, content plan, blog brief, article brief]
tools_required: [web-search, web-crawl, browse-page, http-request, file-write, memory-write, memory-read]
---

# Content Brief Generation

When this skill activates, you are generating a comprehensive content brief for a writer or content team. Follow this structured workflow precisely.

## Phase 1: Brief Requirements

Confirm or retrieve from memory:
1. **Target keyword** — the primary keyword this content should rank for
2. **Secondary keywords** — related terms and long-tail variations to include
3. **Content type** — blog post, landing page, pillar page, comparison, listicle, how-to guide
4. **Target audience** — who will read this content, their knowledge level, and pain points
5. **Business goal** — awareness, lead generation, conversion, link bait, or thought leadership
6. **Brand voice** — tone guidelines, style preferences, any do/don't rules

Check working memory for existing keyword research: `keywords:[domain]:*`

## Phase 2: SERP Intelligence Gathering

### 2.1 SERP Landscape Analysis
Use `web-search` for the target keyword and analyze:
- **Content types ranking**: blog posts, tools, videos, product pages, news
- **SERP features**: featured snippets (paragraph, list, table), PAA boxes, image packs, video carousels, knowledge panels
- **Search intent**: confirm whether informational, commercial, transactional, or mixed
- **Content freshness**: are recent dates favored? How recent are top results?

Store SERP analysis in working memory: `brief:[keyword]:serp-analysis`

### 2.2 People Also Ask (PAA) Mining
From web search results, collect:
- All PAA questions visible for the target keyword
- Related searches and suggested queries
- Auto-complete variations

These become the FAQ section of the brief and inform subheading structure.

### 2.3 Top Competitor Content Analysis
Use `web-crawl` and `browse-page` on the top 5 ranking pages to extract:
- **Word count** — calculate average, median, and range
- **Heading structure** — full H2/H3 outline from each competitor
- **Topics covered** — list every subtopic and section theme
- **Content format** — how they structure the content (intro, sections, conclusion)
- **Media usage** — images, videos, infographics, tables, embedded tools
- **Internal/external links** — how many and to what types of resources
- **Unique angles** — what differentiator or original insight does each bring
- **Calls to action** — what conversion elements appear and where

Store competitor outlines in working memory: `brief:[keyword]:competitor-outlines`

## Phase 3: Content Gap & Opportunity Analysis

### 3.1 Topic Coverage Matrix
Build a matrix of all subtopics covered across competitors:

| Subtopic | Competitor 1 | Competitor 2 | Competitor 3 | Competitor 4 | Competitor 5 |
|----------|-------------|-------------|-------------|-------------|-------------|
| [topic]  | Y/N | Y/N | Y/N | Y/N | Y/N |

Identify:
- **Table stakes topics** — covered by 4-5 competitors (must include)
- **Differentiator topics** — covered by only 1-2 (opportunity to include)
- **Missing topics** — not covered by anyone (potential unique angle)

### 3.2 Entity & Concept Extraction
From competitor content, extract key entities:
- **People** — experts, founders, thought leaders mentioned
- **Products/Tools** — software, services, platforms referenced
- **Concepts** — industry terms, frameworks, methodologies discussed
- **Statistics** — data points, studies, surveys cited
- **Examples** — case studies, real-world examples used

These entities help create topical depth and satisfy semantic search signals.

### 3.3 Question Mining
Compile all questions the content should answer:
- PAA questions from Phase 2.2
- Questions implied by competitor headings
- Questions from related forums/communities (if available via web-search)
- Logical follow-up questions a reader would have

## Phase 4: Brief Assembly

### 4.1 Recommended Title
Provide 3-5 title options that:
- Include the primary keyword naturally
- Are optimized for CTR (numbers, power words, specificity)
- Differ from existing top-ranking titles to stand out in SERPs
- Stay within 50-60 characters

### 4.2 Meta Description
Provide 2-3 meta description options:
- 150-160 characters
- Include primary keyword
- Clear value proposition and CTA
- Differentiated from competitor meta descriptions

### 4.3 Content Outline
Build a detailed heading structure:
- **H1**: One primary heading (different from title tag)
- **H2s**: Major section headings covering all table-stakes and differentiator topics
- **H3s**: Subsections within each H2
- For each H2/H3, include a 1-2 sentence description of what to cover
- Include recommended word count per section

### 4.4 Word Count Target
Based on competitor analysis:
- **Minimum word count**: match the shortest top-3 competitor
- **Target word count**: match or exceed the median of top-5
- **Maximum word count**: don't exceed longest competitor by >20% (avoid fluff)
- Provide section-level word count guidance

### 4.5 Key Entities & Terms to Include
List all terms the writer must naturally incorporate:
- Primary keyword (target frequency: 3-5 mentions)
- Secondary keywords (1-2 mentions each)
- Semantic entities from Phase 3.2
- Avoid keyword stuffing guidance

### 4.6 Internal Linking Recommendations
- Specific existing pages to link FROM this new content
- Pages that should link TO this new content once published
- Recommended anchor text for each link

### 4.7 Visual & Media Requirements
- Recommended number of images
- Suggested image types (screenshots, infographics, charts, stock photos)
- Video embed opportunities
- Table or comparison chart recommendations
- Custom graphic or diagram suggestions

### 4.8 Schema Markup Recommendations
- Applicable schema types (Article, FAQ, HowTo, Breadcrumb)
- Which FAQ questions to mark up
- Rich result targeting strategy

## Phase 5: Deliverable Generation

Generate the complete content brief using `file-write`:

```markdown
# Content Brief: [Target Keyword]
## Generated: [Date]

### Overview
- **Primary Keyword**: [keyword]
- **Secondary Keywords**: [list]
- **Search Intent**: [type]
- **Content Type**: [format]
- **Target Word Count**: [range]
- **Target Audience**: [description]

### Title Options
1. [Title 1] (XX chars)
2. [Title 2] (XX chars)
3. [Title 3] (XX chars)

### Meta Description Options
1. [Meta 1] (XXX chars)
2. [Meta 2] (XXX chars)

### Detailed Outline
[Full H1/H2/H3 structure with section descriptions and word counts]

### Questions to Answer
[Bulleted list of all questions this content must address]

### Key Entities & Terms
[List of terms and concepts to include naturally]

### Competitor Reference
| URL | Word Count | Unique Angle | Weakness |
|-----|-----------|-------------|----------|

### Internal Linking Plan
[Specific link recommendations with anchor text]

### Visual & Media Requirements
[Specific media recommendations]

### Schema Markup
[Recommended schema types and FAQ questions]

### Writer Notes
[Any additional guidance, tone notes, or constraints]
```

## Phase 6: Memory Update

After completing the brief:
1. Store brief summary and target keyword in working memory: `brief:[keyword]:summary`
2. Link to any existing keyword research data
3. Store competitor outlines for future reference in content strategy work
4. Note publication deadline or priority if mentioned by client
