# Content Strategy for SEO — Senior Consultant's Playbook

## Search Intent Framework

Every query has intent. If your content doesn't match it, you won't rank. Period.

### The Four Intent Types

#### 1. Informational ("I want to learn")
- **Signals:** "how to," "what is," "why does," "guide," "tutorial," "examples"
- **Content format:** Blog posts, guides, tutorials, videos, infographics
- **Funnel position:** Top of funnel — awareness
- **Conversion expectation:** Low direct conversion. High for email capture, retargeting, brand awareness.
- **Examples:** "how to build backlinks," "what is schema markup," "SEO best practices"

#### 2. Commercial Investigation ("I'm comparing options")
- **Signals:** "best," "vs," "review," "comparison," "top," "alternatives"
- **Content format:** Comparison tables, review articles, "best of" listicles, case studies
- **Funnel position:** Middle of funnel — consideration
- **Conversion expectation:** Medium. These users are actively evaluating solutions.
- **Examples:** "best SEO tools 2025," "Ahrefs vs Semrush," "Shopify SEO review"

#### 3. Transactional ("I want to buy/do")
- **Signals:** "buy," "price," "discount," "coupon," "free trial," "sign up," "download"
- **Content format:** Product pages, pricing pages, landing pages, service pages
- **Funnel position:** Bottom of funnel — decision
- **Conversion expectation:** High. These users are ready to act.
- **Examples:** "Ahrefs pricing," "SEO audit service," "buy backlinks" (don't actually)

#### 4. Navigational ("I'm looking for a specific site")
- **Signals:** Brand names, specific product names, "login," "support"
- **Content format:** Homepage, login pages, support pages
- **Funnel position:** N/A — brand
- **Examples:** "Google Search Console," "Ahrefs login," "Moz blog"

### How to Determine Intent

1. **Google it.** Look at what currently ranks. That's what Google has determined the intent to be.
2. **Analyze the SERP features:**
   - Featured snippet → Informational
   - Shopping results → Transactional
   - Knowledge panel → Navigational or informational
   - Local pack → Local intent
   - Video carousel → Video content preferred
   - "People Also Ask" → Informational
3. **Look at the top 5 results' content type and format.** If all 5 are comparison articles, don't create a product page. Match the format.

### Intent Mismatch = Ranking Failure

**Common mistakes:**
- Targeting "best project management tools" with your own product page (intent is comparison, not product)
- Targeting "how to do keyword research" with a service page (intent is tutorial, not commercial)
- Targeting "SEO agency" with a blog post (intent is finding a service, not reading about it)

**Fix:** Create the content type that matches the intent, even if it's not what you'd prefer to rank. You can still convert — just do it within the content format Google expects.

## Topic Cluster Methodology

### The Model

```
                    ┌─── Supporting Article A
                    │
Pillar Page ────────┼─── Supporting Article B
(broad topic)       │
                    ├─── Supporting Article C
                    │
                    └─── Supporting Article D
```

**Pillar page:** Comprehensive overview of a broad topic (2,000-5,000 words). Targets a competitive head term. Links out to every supporting article.

**Supporting articles (spokes):** Deep-dive into specific subtopics (1,500-3,000 words each). Target long-tail keywords. Link back to the pillar and to each other where relevant.

### Building a Topic Cluster — Step by Step

**Example: "Link Building" cluster**

1. **Identify the pillar topic:** "Link Building" (high volume, competitive)

2. **Map subtopics using keyword research:**
   - Ahrefs Keywords Explorer → enter "link building" → view "Also rank for" and "Questions"
   - Google's "People Also Ask" for the topic
   - Competitor content audit — what subtopics do they cover?
   - AnswerThePublic or AlsoAsked.com for question mapping

3. **Create the content map:**

   | Content | Target Keyword | Intent | Type | Word Count |
   |---------|---------------|--------|------|------------|
   | **Pillar:** Complete Link Building Guide | link building | Info | Guide | 4,000 |
   | Guest Posting Strategy | guest posting for SEO | Info | How-to | 2,500 |
   | Broken Link Building | broken link building | Info | Tutorial | 2,000 |
   | Link Building Outreach Templates | link building email templates | Info/Commercial | Templates | 2,000 |
   | How to Evaluate Backlink Quality | how to check backlink quality | Info | Guide | 1,800 |
   | Digital PR for Link Building | digital PR SEO | Info | Guide | 2,500 |
   | Link Building Tools Comparison | best link building tools | Commercial | Comparison | 3,000 |
   | Competitor Backlink Analysis | competitor backlink analysis | Info | Tutorial | 2,000 |

4. **Internal linking structure:**
   - Pillar links to all 7 supporting articles
   - Each supporting article links back to pillar
   - Supporting articles cross-link where contextually relevant (e.g., "outreach templates" links to "guest posting" and "broken link building")

5. **Publish and interlink:** Build pillar first, then supporting content over 4-8 weeks. Add links as each piece goes live.

### Why Clusters Work

- Google associates your domain with topical authority on the cluster topic
- Internal links concentrate PageRank on the pillar page
- Users can explore related content (better engagement, lower bounce rate)
- Keyword cannibalization is reduced because each page targets a distinct sub-keyword

## Content Gap Analysis

### Process

1. **Identify competitors:** 3-5 sites ranking for your target keywords

2. **Keyword gap analysis (Ahrefs):**
   - Go to Content Gap tool
   - Enter your domain + competitors
   - Find keywords where 2+ competitors rank but you don't
   - Filter: Volume > 100, KD < 50 (depending on your site's authority)
   - Group by topic to identify cluster opportunities

3. **Content gap analysis (manual):**
   - List every piece of content on your top 3 competitors
   - Categorize by topic, format, and intent
   - Identify topics they cover that you don't
   - Identify topics they cover poorly (thin content, outdated info)

4. **SERP gap analysis:**
   - For your target keywords, what SERP features appear that you're not capturing?
   - Featured snippets you could win
   - "People Also Ask" questions you haven't answered
   - Video carousels where you have no video content
   - Image packs where your images don't appear

5. **Prioritize by:**
   - Business relevance (does this keyword drive revenue?)
   - Search volume (enough demand to justify content creation?)
   - Keyword difficulty (can you realistically rank?)
   - Competitive gap (how many competitors already cover this? Can you do better?)

## Featured Snippet Optimization

### Types and How to Win Them

#### Paragraph Snippets (most common, ~70%)

**Target keywords:** "What is," "why is," "how does," definition-style queries

**How to win:**
1. Include the question as an H2 or H3
2. Immediately follow with a 40-60 word direct answer
3. The answer should be a concise, factual definition or explanation
4. Then expand with more detail below

```html
<h2>What is a canonical tag?</h2>
<p>A canonical tag (rel="canonical") is an HTML element that tells search 
engines which version of a URL is the preferred "master" copy. It's used 
to prevent duplicate content issues when the same or similar content is 
accessible at multiple URLs. The canonical tag is placed in the <head> 
section of the duplicate pages, pointing to the preferred URL.</p>

<p>Here's how it works in more detail...</p>
```

#### List Snippets (~20%)

**Target keywords:** "How to," "steps to," "best," "top," numbered or bulleted lists

**How to win:**
1. Use a clear H2 with the query
2. Use ordered (numbered) or unordered (bulleted) lists, OR use H3 subheadings for each step
3. Google often pulls list snippets from H3 subheadings under an H2

```html
<h2>How to Do Keyword Research (7 Steps)</h2>
<h3>1. Define your seed keywords</h3>
<p>...</p>
<h3>2. Use keyword research tools to expand</h3>
<p>...</p>
<h3>3. Analyze search intent for each keyword</h3>
<p>...</p>
```

#### Table Snippets (~10%)

**Target keywords:** Comparisons, pricing, specifications, data

**How to win:**
1. Use proper HTML `<table>` elements (not div-based fake tables)
2. Include `<thead>` with clear column headers
3. Keep data concise and structured
4. Target queries that implicitly ask for a comparison

```html
<h2>SEO Tool Pricing Comparison 2025</h2>
<table>
  <thead>
    <tr><th>Tool</th><th>Starting Price</th><th>Free Plan</th><th>Best For</th></tr>
  </thead>
  <tbody>
    <tr><td>Ahrefs</td><td>$129/mo</td><td>Limited free tools</td><td>Backlink analysis</td></tr>
    <tr><td>Semrush</td><td>$139.95/mo</td><td>10 queries/day</td><td>All-in-one SEO</td></tr>
    <tr><td>Moz Pro</td><td>$99/mo</td><td>Limited</td><td>Beginners</td></tr>
  </tbody>
</table>
```

### Featured Snippet Steal Strategy

1. Find keywords where you rank in positions 2-10 and a featured snippet exists
2. In GSC, filter by queries where you have high impressions but the featured snippet goes to someone else
3. Analyze the current snippet holder — what format are they using? What's their answer?
4. Rewrite your content to better answer the query in the snippet format
5. Often just restructuring existing content (adding an H2 question + concise answer) is enough

## Content Refresh Strategy

### Why Refresh Content

- **Content decay is real.** Most content peaks at 6-12 months, then rankings gradually decline as newer content appears.
- **Freshness is a ranking signal** for time-sensitive queries.
- **Updating is faster than creating** new content from scratch.
- **Existing pages have link equity** that new pages don't.

### The Content Refresh Process

1. **Identify candidates in GSC:**
   - Pages with declining clicks over 3-6 months
   - Pages ranking positions 5-20 (potential to reach page 1 with a boost)
   - Pages with high impressions but low CTR (title/description needs improvement)
   - Pages older than 12 months that haven't been updated

2. **Audit the current state:**
   - Is the content still accurate?
   - Are statistics and examples current?
   - Has the SERP changed? (New competitors, different content format dominating)
   - Are there new subtopics to cover (check "People Also Ask" again)
   - Are internal/external links still valid?

3. **Update strategy:**
   - **Minor refresh (1-2 hours):** Update year references, refresh stats, fix broken links, update screenshots, improve title/meta
   - **Major refresh (4-8 hours):** Rewrite sections, add new sections based on SERP analysis, add schema markup, improve visuals, expand thin sections
   - **Complete rewrite (8+ hours):** New angle, new structure, significantly expanded content. Keep the same URL to preserve link equity.

4. **After publishing update:**
   - Update the `dateModified` in schema markup (and meta tags if using them)
   - Request indexing in GSC
   - Share on social media
   - Update internal links pointing to the page if the content structure changed
   - Monitor rankings and traffic for 2-4 weeks

### Content Refresh Cadence

| Content Type | Refresh Frequency | Trigger |
|-------------|-------------------|---------|
| "Best of" / comparison posts | Every 3-6 months | Products/pricing change constantly |
| Statistics/data posts | Every 6-12 months | New data available annually |
| How-to guides | Every 12 months | Tools/processes change |
| Evergreen educational | Every 12-18 months | Unless fundamentals change |
| News/trending | Don't refresh — create new | Time-sensitive by nature |

## SERP Feature Targeting

### Which Features to Target

| Feature | How to Qualify | Priority |
|---------|---------------|----------|
| **Featured Snippet** | Rank top 10, structured content | High — massive CTR boost |
| **People Also Ask** | Answer related questions in content | Medium — drives long-tail traffic |
| **Video Carousel** | YouTube video optimized for keyword | Medium — especially for how-to queries |
| **Image Pack** | Optimized images with alt text, on relevant pages | Medium — drives image search traffic |
| **Knowledge Panel** | Schema markup + Wikipedia/Wikidata | High for brands — establish authority |
| **Local Pack** | Google Business Profile + local SEO | Critical for local businesses |
| **Sitelinks** | Clear site architecture, branded queries | Automatic — can't directly control |
| **FAQ Rich Result** | FAQ schema markup | Medium — Google has reduced showing these |

## Content Production Workflow

### For SEO-Driven Content

1. **Keyword research + intent analysis** (30 min)
   - Target keyword, secondary keywords, related terms
   - SERP analysis: what ranks, what format, what length
   - Identify featured snippet opportunity

2. **Content brief creation** (30 min)
   - Target keyword + secondary keywords
   - Required sections (based on SERP analysis of top 5)
   - Target word count
   - Internal linking targets (pages to link TO and FROM)
   - Schema markup type
   - Featured snippet format to target
   - Reference sources / competing content to beat

3. **Writing** (2-6 hours depending on length)
   - Follow the brief
   - Write for humans first, SEO second
   - Include original insights, data, examples
   - Use proper heading hierarchy
   - Front-load value (most important info first)

4. **SEO optimization pass** (30 min)
   - Check keyword placement (title, H1, first 100 words, H2s, alt text)
   - Run through Surfer/Clearscope for NLP term coverage
   - Ensure proper heading structure
   - Add internal links (3-5 minimum per article)
   - Optimize title tag and meta description
   - Add schema markup

5. **Technical check** (15 min)
   - Page loads fast (check with Lighthouse)
   - Mobile renders correctly
   - Images optimized (WebP, proper sizing, alt text)
   - URL is clean and keyword-rich
   - Canonical tag is correct
   - OG tags set for social sharing

6. **Publish + promote** (15 min)
   - Publish and request indexing via GSC
   - Share on social channels
   - Add internal links from existing related content
   - Queue for email newsletter if applicable

7. **Monitor** (ongoing)
   - Track ranking for target keyword in GSC
   - Monitor traffic after 2-4 weeks of indexing
   - Schedule refresh check for 6-12 months later
