---
name: on-page-optimization
description: Analyzes a page's on-page SEO elements and provides detailed optimization recommendations for title tags, meta descriptions, headings, content, internal links, and images
triggers: [on-page, optimize page, title tag, meta description, heading, content optimization]
tools_required: [web-crawl, http-request, browse-page, screenshot, file-write, memory-write, memory-read]
---

# On-Page SEO Optimization

When this skill activates, you are analyzing and optimizing a page's on-page SEO elements. Follow this structured workflow precisely.

## Phase 1: Context & Target Identification

Confirm or retrieve from memory:
1. **Target URL** — the specific page to optimize
2. **Target keyword(s)** — primary keyword and secondary keywords for this page
3. **Search intent** — informational, commercial, transactional, or navigational
4. **Business context** — what role does this page play in the site's funnel?
5. **Competitor URLs** — top 3-5 ranking pages for the target keyword

If this is a returning client, check working memory for previous keyword research and audit findings.

## Phase 2: Current Page Analysis

### 2.1 Crawl & Extract Page Elements
Use `web-crawl` on the target URL to extract:
- Title tag (length, keyword placement, brand inclusion)
- Meta description (length, keyword inclusion, CTA/value proposition)
- H1 tag (uniqueness, keyword usage, alignment with title)
- H2-H6 hierarchy (logical structure, keyword distribution, completeness)
- Body content (word count, keyword density, readability, topical depth)
- Internal links (count, anchor text, relevance of linked pages)
- External links (count, authority of linked domains, broken links)
- Images (alt text presence, descriptive quality, file size, format)

Store raw data in working memory: `onpage:[domain]:[slug]:current`

### 2.2 Technical On-Page Signals
Use `http-request` to check:
- Canonical tag (self-referencing, correct URL)
- Open Graph and Twitter Card meta tags
- Schema/structured data on the page
- URL structure (length, keyword inclusion, clean slug)
- HTTP status code and redirect behavior
- Content-Type and language headers

### 2.3 Visual Assessment
Use `screenshot` to capture the page and evaluate:
- Above-the-fold content quality and keyword visibility
- Layout and content hierarchy visual flow
- CTA placement and prominence
- Mobile rendering (if possible)

## Phase 3: SERP & Competitor Benchmarking

### 3.1 SERP Analysis
Use `web-search` for the target keyword to understand:
- What SERP features appear (featured snippets, PAA, image pack, video carousel)
- What content format ranks (listicle, guide, comparison, tool)
- Average content depth and word count of top results
- Common topics and subtopics covered by ranking pages

### 3.2 Competitor Page Analysis
For each of the top 3-5 ranking URLs, use `web-crawl` and `browse-page` to analyze:
- Title tag patterns (length, format, keyword positioning)
- Heading structure (number of H2s/H3s, topic coverage)
- Content depth (word count, subtopics, unique angles)
- Internal link patterns
- Schema types used
- Media usage (images, videos, infographics)

Store competitor benchmarks in working memory: `onpage:[domain]:[slug]:competitors`

## Phase 4: Gap Analysis & Recommendations

Compare the target page against competitors and best practices:

### 4.1 Title Tag Optimization
- **Length**: 50-60 characters (check pixel width ~580px)
- **Primary keyword**: within first 60% of title
- **Power words**: include action/emotional triggers when appropriate
- **Brand**: append if recognizable, omit if space-constrained
- Provide 3 title tag variations ranked by predicted CTR

### 4.2 Meta Description Optimization
- **Length**: 150-160 characters (check pixel width ~920px)
- **Keyword inclusion**: natural placement of primary keyword
- **CTA/value proposition**: clear reason to click
- **Uniqueness**: differentiated from competing SERP results
- Provide 3 meta description variations

### 4.3 Heading Structure Optimization
- H1 should be unique, contain primary keyword, differ from title tag
- H2s should cover all major subtopics that competitors address
- Identify missing subtopic H2s compared to top-ranking pages
- H3s should break down H2 sections logically
- Flag keyword stuffing or unnatural heading usage

### 4.4 Content Optimization
- **Content gaps**: topics covered by competitors but missing from this page
- **Thin sections**: areas that need expansion with more depth or examples
- **Keyword integration**: natural keyword and entity placement recommendations
- **Readability**: sentence length, paragraph length, transition usage
- **Freshness signals**: dates, statistics, references that need updating
- **E-E-A-T signals**: experience, expertise, authority, trust indicators

### 4.5 Internal Link Optimization
- Identify missing internal link opportunities (pages that should link here)
- Recommend anchor text improvements for existing internal links
- Suggest outbound internal links from this page to related content
- Flag excessive or irrelevant internal links

### 4.6 Image Optimization
- Alt text: descriptive, keyword-relevant where natural, not stuffed
- File names: descriptive, hyphenated, keyword-relevant
- File format: WebP/AVIF preferred over PNG/JPEG
- Lazy loading: implemented for below-fold images
- Dimensions: specified to prevent CLS

### 4.7 Schema Markup Recommendations
- Identify applicable schema types (Article, FAQ, HowTo, Product, Breadcrumb)
- Provide JSON-LD code snippets for recommended schema
- Check Google rich result eligibility

## Phase 5: Report Generation

Generate a detailed optimization report using `file-write`:

```markdown
# On-Page SEO Optimization Report
## [URL] — [Date]
## Target Keyword: [Primary Keyword]

### Current Score Summary
| Element | Current Status | Priority | Impact |
|---------|---------------|----------|--------|
| Title Tag | [status] | [P0-P3] | [High/Med/Low] |
| Meta Description | [status] | [P0-P3] | [High/Med/Low] |
| H1 | [status] | [P0-P3] | [High/Med/Low] |
| Heading Structure | [status] | [P0-P3] | [High/Med/Low] |
| Content Depth | [status] | [P0-P3] | [High/Med/Low] |
| Internal Links | [status] | [P0-P3] | [High/Med/Low] |
| Images | [status] | [P0-P3] | [High/Med/Low] |
| Schema | [status] | [P0-P3] | [High/Med/Low] |

### Title Tag Recommendations
[3 variations with reasoning]

### Meta Description Recommendations
[3 variations with reasoning]

### Heading Structure Recommendations
[Proposed heading hierarchy with specific H2/H3 additions]

### Content Gaps to Fill
[Specific topics/sections to add, with competitor evidence]

### Internal Linking Recommendations
[Specific pages to link to/from with anchor text suggestions]

### Image Optimization Checklist
[Specific images with alt text recommendations]

### Schema Markup Code
[Ready-to-implement JSON-LD snippets]

### Implementation Priority
1. [Quick wins — title, meta, H1 changes]
2. [Content additions and restructuring]
3. [Technical improvements — schema, images, links]
```

## Phase 6: Memory Update

After completing the optimization analysis:
1. Store the optimization summary and key recommendations in working memory: `onpage:[domain]:[slug]:recommendations`
2. Store baseline metrics (word count, heading count, link count) for future comparison
3. Note any dependencies on other pages or site-wide changes needed
