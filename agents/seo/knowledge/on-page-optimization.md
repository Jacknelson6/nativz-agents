# On-Page Optimization — Senior Consultant's Playbook

## Title Tags

### The Rules

- **Pixel width limit:** ~580px on desktop, ~480px on mobile. NOT 60 characters. A title with all "W"s truncates at ~35 chars; all "i"s can go to ~100. Use a SERP preview tool to check.
- **Front-load primary keyword.** Google weights words at the beginning slightly more, and truncated titles still show the keyword.
- **Include a compelling hook:** Numbers, power words ("Ultimate," "Complete," "2025"), brackets [Free Template], questions
- **Brand name at end:** `Primary Keyword — Secondary | Brand` unless you're a major brand (then lead with brand for navigational queries)
- **Unique per page.** Duplicate titles are a waste of indexation.

### Title Tag Formulas That Work

```
[Number] + [Adjective] + [Keyword] + [Promise] + [Year]
"15 Proven Link Building Strategies That Actually Work (2025)"

[How to] + [Keyword] + [Benefit]
"How to Fix Core Web Vitals Issues and Boost Your Google Rankings"

[Keyword]: [Subtitle with hook]
"Technical SEO Audit: The Complete 87-Point Checklist"

[Keyword] + [Comparison/vs]
"Ahrefs vs Semrush: Which SEO Tool Is Actually Worth It?"
```

### Preventing Google Title Rewrites

Google rewrites ~60% of titles. To prevent it:
1. Keep titles under pixel width limit (truncated titles get rewritten more)
2. Make sure the title accurately represents the page content
3. Don't keyword-stuff titles
4. Ensure the H1 and title tag are aligned (if they're wildly different, Google may choose the H1)
5. Don't use the same boilerplate in every title (e.g., "| Best Company Ever | #1 Service")

## Meta Descriptions

- **Length:** 150-160 characters (or ~920px on desktop). Google sometimes shows longer snippets (~300 chars) for broad queries.
- **Include target keyword:** It gets bolded in SERPs, improving CTR
- **Write a mini-ad:** What is the page about? Why should the user click? What will they get?
- **Include a CTA:** "Learn how," "Discover," "Get the free guide," "Compare options"
- **Unique per page.** Duplicate or missing meta descriptions = Google generates its own (often poorly)

```html
<meta name="description" content="Learn the 15 most effective link building strategies used by SEO professionals in 2025. Includes templates, outreach scripts, and real case studies with results." />
```

**Reality check:** Google ignores meta descriptions for ~70% of queries and generates its own snippet from page content. But for your target keywords, a well-written description still improves CTR significantly. Always write them.

## Heading Hierarchy

### Structure

```
H1: Primary keyword + page topic (ONE per page)
  H2: Major subtopic / section
    H3: Sub-section within H2
      H4: Detail within H3 (rarely needed)
  H2: Next major subtopic
    H3: Sub-section
```

### Rules

1. **One H1 per page.** HTML5 technically allows multiple, but for SEO, use one. It should be your primary keyword target.
2. **H2s are your outline.** Each should cover a distinct subtopic. Google uses H2s for passage-based ranking and "jump to" links.
3. **Keywords in H2s.** Use secondary/related keywords naturally in H2 headings.
4. **Don't skip levels.** Don't jump from H2 to H4. (Minor issue but signals sloppy structure.)
5. **Heading tags for structure, not styling.** Don't use H3 because you want smaller bold text. Use CSS.

### Featured Snippet Optimization via Headings

Google pulls featured snippets from well-structured content. To target them:

**For paragraph snippets:**
```html
<h2>What is [keyword]?</h2>
<p>[40-60 word concise definition that directly answers the question]</p>
```

**For list snippets:**
```html
<h2>How to [keyword] (Step by Step)</h2>
<h3>Step 1: [Action]</h3>
<p>Details...</p>
<h3>Step 2: [Action]</h3>
<p>Details...</p>
```

**For table snippets:**
```html
<h2>[Keyword] Comparison</h2>
<table>
  <thead><tr><th>Feature</th><th>Option A</th><th>Option B</th></tr></thead>
  <tbody>...</tbody>
</table>
```

## Content Optimization

### Search Intent Matching

Before writing a single word, analyze page 1 of Google for your target keyword:

1. **What content type ranks?** Blog posts? Product pages? Videos? Tools?
2. **What format?** Listicles? How-tos? Guides? Comparisons?
3. **What's the dominant word count?** (Use Surfer SEO or manually check — average the top 5)
4. **What subtopics do all top results cover?** These are "must-have" sections.
5. **What's missing?** Gaps in existing content = your opportunity.

If everyone ranking for "best CRM software" has comparison tables with pricing, and you write a 500-word opinion piece, you won't rank. Match the intent and format, then exceed the quality.

### E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trustworthiness)

Google's Quality Rater Guidelines emphasize E-E-A-T, especially for YMYL (Your Money, Your Life) topics.

**Practical E-E-A-T signals to implement:**

- **Author bylines with linked author pages.** Author pages should include credentials, social links, and other published work.
- **Author schema markup:**
  ```json
  {
    "@type": "Person",
    "name": "Dr. Sarah Chen",
    "jobTitle": "Senior SEO Strategist",
    "url": "https://example.com/team/sarah-chen",
    "sameAs": [
      "https://twitter.com/sarahchen",
      "https://linkedin.com/in/sarahchen"
    ]
  }
  ```
- **Citations and references.** Link to authoritative sources (studies, official docs, government sites).
- **First-hand experience signals.** Original screenshots, photos, data, case studies. Google explicitly looks for "experience" now.
- **Editorial standards page.** Explains your content process, fact-checking, and update policy.
- **About page** with team credentials, awards, press mentions.
- **Contact information** visible and accessible.

### Content Length Guidelines

There's no magic number. Length should match intent:

| Intent | Typical Length | Examples |
|--------|---------------|----------|
| Quick answer | 300-800 words | "What is a canonical tag?" |
| How-to guide | 1,500-3,000 words | "How to set up Google Analytics 4" |
| Comprehensive guide | 3,000-7,000 words | "Complete Guide to Technical SEO" |
| Comparison/review | 2,000-4,000 words | "Ahrefs vs Semrush 2025" |
| Product page | 300-1,000 words | E-commerce product pages |

**Don't pad content for length.** 2,000 words of value beats 5,000 words of fluff. Google's helpful content system specifically targets low-value padding.

### Keyword Placement

**Must-have locations:**
1. Title tag (front-loaded)
2. H1 heading
3. First 100 words of body content
4. At least one H2
5. Meta description
6. URL slug
7. Image alt text (primary image)

**Natural density:** Don't count keyword density percentages. Write naturally. Use the primary keyword, its variations, and semantically related terms. Tools like Surfer SEO, Clearscope, or MarketMuse provide NLP-based term suggestions.

### NLP & Entity Optimization

Google's NLP models (BERT, MUM) understand entities and topics, not just keywords. To optimize:

1. **Cover related entities.** For "link building," also discuss: backlinks, anchor text, domain authority, PageRank, referring domains, outreach, guest posting.
2. **Use tools for entity coverage:** Surfer SEO's content editor, Clearscope, MarketMuse, or free alternatives like Google's NLP API demo.
3. **Answer related questions.** Check "People Also Ask" boxes and address those questions in your content.

## Internal Linking

### Strategy

Internal links distribute PageRank and establish topical relationships. They're one of the few ranking factors you have complete control over.

**Topic Cluster Model:**
```
Pillar Page: "Link Building Guide" (targets broad head term)
  ├── "Guest Posting Strategy" (supports pillar, targets long-tail)
  ├── "Broken Link Building Tutorial" (supports pillar)
  ├── "Digital PR for SEO" (supports pillar)
  ├── "Link Building Outreach Templates" (supports pillar)
  └── "How to Evaluate Link Quality" (supports pillar)
```

Each supporting page links to the pillar. The pillar links to each supporting page. Supporting pages link to each other where relevant.

### Anchor Text Best Practices

- **Descriptive, keyword-rich anchors** for internal links (unlike external links where you want natural/diverse anchors). Internal link anchor text is a strong relevance signal.
- **Avoid "click here" or "read more."** Use: "Learn more about [topic]" or naturally embed the link: "Our guide to technical SEO audits covers this in detail."
- **Vary anchors slightly** to avoid looking templated, but keep them descriptive.

### Finding Internal Linking Opportunities

1. **Screaming Frog:** Crawl site → Inlinks report shows pages with few internal links (orphan pages)
2. **Google Search:** `site:example.com "keyword"` to find pages that mention a topic but don't link to your target page
3. **Screaming Frog custom search:** Crawl + extract pages containing specific text but missing links to target URL
4. **Content audit spreadsheet:** Map every page to its target keyword and identify natural linking opportunities between related pages

### Link Equity Flow

- **Homepage** has the most link equity. Pages linked from the homepage get more authority.
- **Navigation links** pass equity to every page they appear on. Choose navigation items strategically.
- **Footer links** pass equity but are devalued compared to in-content links. Don't stuff keywords in footers.
- **Deep pages** (4+ clicks from homepage) get less equity and crawl attention. Flatten your architecture.

## Image Optimization

1. **File format:** WebP for photos (30% smaller than JPEG), SVG for icons/logos, AVIF for next-gen (limited browser support still). Always provide fallbacks.
2. **Compression:** Target 85% quality for JPEG/WebP. Use tools: Squoosh, ImageOptim, ShortPixel, or automated CDN optimization (Cloudflare Polish, imgix).
3. **Dimensions:** Serve properly sized images. A 4000px image displayed at 400px wastes bandwidth. Use `srcset` and `sizes`:
   ```html
   <img 
     src="image-800.webp" 
     srcset="image-400.webp 400w, image-800.webp 800w, image-1200.webp 1200w"
     sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
     alt="Descriptive alt text with target keyword"
     width="800"
     height="600"
     loading="lazy"
   />
   ```
4. **Alt text:** Describe the image content. Include target keyword naturally if relevant. Don't keyword stuff. Empty `alt=""` for decorative images.
5. **File names:** `red-running-shoes.webp` not `IMG_4523.webp`
6. **Lazy loading:** `loading="lazy"` on all images below the fold. NEVER lazy-load the LCP image.

## Schema Markup Templates

### FAQ Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is technical SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Technical SEO refers to optimizing your website's infrastructure to help search engines crawl, render, and index your content effectively. It includes site speed, mobile-friendliness, structured data, XML sitemaps, and security."
      }
    },
    {
      "@type": "Question",
      "name": "How long does SEO take to work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most SEO campaigns take 4-6 months to see meaningful results, though competitive industries may take 12+ months. Quick wins like fixing technical issues can show impact within weeks."
      }
    }
  ]
}
```

### HowTo Schema

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Submit Your Sitemap to Google",
  "description": "A step-by-step guide to submitting your XML sitemap via Google Search Console.",
  "totalTime": "PT5M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Open Google Search Console",
      "text": "Navigate to search.google.com/search-console and select your property.",
      "url": "https://example.com/guide#step1",
      "image": "https://example.com/images/step1.png"
    },
    {
      "@type": "HowToStep",
      "name": "Go to Sitemaps",
      "text": "Click 'Sitemaps' in the left sidebar under the 'Indexing' section.",
      "url": "https://example.com/guide#step2"
    },
    {
      "@type": "HowToStep",
      "name": "Enter Sitemap URL",
      "text": "Type your sitemap URL (e.g., /sitemap.xml) and click Submit.",
      "url": "https://example.com/guide#step3"
    }
  ]
}
```

### Product Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Acme Running Shoes Pro",
  "image": "https://example.com/images/shoes-pro.jpg",
  "description": "Professional-grade running shoes with carbon fiber plate.",
  "brand": {
    "@type": "Brand",
    "name": "Acme"
  },
  "sku": "ACME-RS-PRO-001",
  "gtin13": "0123456789012",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/shoes/acme-pro",
    "priceCurrency": "USD",
    "price": "179.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Example Store"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "342"
  }
}
```

### Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Company",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "A leading provider of SEO services since 2010.",
  "foundingDate": "2010",
  "founders": [
    {
      "@type": "Person",
      "name": "Jane Smith"
    }
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-555-5555",
    "contactType": "customer service",
    "email": "hello@example.com"
  },
  "sameAs": [
    "https://twitter.com/example",
    "https://linkedin.com/company/example",
    "https://facebook.com/example"
  ]
}
```

### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://example.com/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Technical SEO Guide",
      "item": "https://example.com/blog/technical-seo-guide/"
    }
  ]
}
```

### Article Schema (complete)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "The Complete Guide to On-Page SEO in 2025",
  "description": "Everything you need to know about on-page optimization.",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/images/on-page-seo-guide.jpg",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": "Sarah Chen",
    "url": "https://example.com/team/sarah-chen"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example SEO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png",
      "width": 600,
      "height": 60
    }
  },
  "datePublished": "2025-01-15T08:00:00+00:00",
  "dateModified": "2025-01-20T14:30:00+00:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/blog/on-page-seo-guide/"
  },
  "wordCount": 4500,
  "keywords": ["on-page SEO", "title tags", "meta descriptions", "schema markup"]
}
```

## URL Structure

- **Short and descriptive:** `/blog/technical-seo-guide/` not `/blog/2025/01/15/the-complete-ultimate-guide-to-technical-seo-optimization-tips/`
- **Include target keyword** in the slug
- **Hyphens between words,** not underscores
- **Lowercase only.** URLs are case-sensitive on most servers.
- **No parameters** for indexable pages when possible. Clean URLs rank better.
- **Static > dynamic.** `/shoes/red-sneakers/` > `/product.php?id=123&cat=shoes`
- **Flat architecture.** Fewer subdirectories = closer to root = more crawl priority. `/blog/post-name/` > `/blog/category/subcategory/2025/post-name/`
