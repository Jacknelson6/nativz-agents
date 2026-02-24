# Google Ads — Expert Knowledge Base

## Search Campaigns

### Match Types (2025)
Google has simplified match types. There are now effectively three:

**Broad Match**
- Triggers for searches related to your keyword's meaning, including synonyms, related queries, and implied intent
- Example: keyword `running shoes` can match "best sneakers for jogging," "marathon footwear," "nike pegasus review"
- **Use when**: Paired with Smart Bidding (tCPA/tROAS), sufficient conversion data (30+/mo per campaign), and you want maximum reach
- Broad + Smart Bidding is Google's recommended approach in 2025 and genuinely works well for accounts with conversion history
- **Don't use when**: Low budget, new account with no conversion data, or you need tight control

**Phrase Match**
- Triggers when the search includes the meaning of your keyword in the right context
- Example: keyword `"running shoes"` matches "buy running shoes online" and "best shoes for running" but not "shoe running machine"
- **Use when**: You want reach with some guardrails, or broad match is spending on irrelevant queries

**Exact Match**
- Triggers for searches with the same meaning as your keyword (includes close variants, reordering, implied words)
- Example: keyword `[running shoes]` matches "shoes for running" and "running shoe" but not "trail hiking shoes"
- **Use when**: High-intent, high-CPC keywords where you need precision; brand campaigns; limited budgets

### Recommended Match Type Strategy
```
Campaign: Brand (Exact Match)
  → [brand name], [brand name reviews], [brand name discount]
  → Bid aggressively, these are your cheapest conversions

Campaign: Non-Brand High Intent (Phrase + Exact)
  → "buy [product]", [product] + purchase intent modifiers
  → Medium bids, focus on ROAS

Campaign: Non-Brand Broad (Broad Match + Smart Bidding)
  → Generic category terms, broad discovery
  → Let Smart Bidding control bids, monitor search terms weekly
```

### Negative Keywords
Negative keywords are **critical** — especially with broad match. Build and maintain negative keyword lists aggressively.

**Starter negative list** (add to all non-brand campaigns):
- Jobs, careers, hiring, salary, indeed, glassdoor
- Free, torrent, pirate, crack
- DIY, homemade, how to make
- Reddit, quora, forum (unless you want informational traffic)
- Your brand terms (in non-brand campaigns to force brand traffic to brand campaign)

**Ongoing hygiene:**
- Review Search Terms Report **weekly** for campaigns spending >$100/day
- Review **bi-weekly** for smaller campaigns
- Add negatives at the campaign level (not ad group) unless you have a specific reason
- Use **negative keyword lists** (shared library) for cross-campaign negatives
- Create lists by theme: competitor names, job-seekers, DIY, informational

### Ad Extensions (Assets)
Extensions improve CTR by 10-20% and are **free to add**. Use all relevant ones:

| Extension | Impact | Priority |
|---|---|---|
| Sitelinks | +10-15% CTR | **Required** — add 8+ (4 show on desktop) |
| Callouts | +5-10% CTR | **Required** — "Free Shipping," "24/7 Support," "No Contract" |
| Structured Snippets | +5-8% CTR | High — "Types: X, Y, Z" |
| Call Extension | +5-10% CTR on mobile | High for local/service businesses |
| Location | +10%+ CTR for local | Required for local businesses |
| Price | +5-10% CTR | High for ecommerce |
| Image | +10-15% CTR | High — upload product/lifestyle images |
| Lead Form | Variable | Good for lead gen (captures in-SERP) |

### Quality Score
Quality Score (1-10) determines your ad rank and actual CPC. Components:
- **Expected CTR** (most important) — historical CTR of your ad for that keyword
- **Ad Relevance** — how closely your ad matches the search intent
- **Landing Page Experience** — page load speed, relevance, mobile-friendliness

Improving Quality Score:
1. **Tighter ad groups** — group 5-15 tightly related keywords per ad group
2. **Keyword in headline** — use dynamic keyword insertion or write specific headlines per ad group
3. **Landing page relevance** — send traffic to specific product/service pages, not your homepage
4. **Page speed** — under 3 seconds on mobile (use PageSpeed Insights, target 70+ score)
5. **RSA optimization** — pin your best-performing headlines to positions 1-2

Quality Score benchmarks:
- **7-10**: Good — you're paying below average CPC
- **5-6**: Average — room for improvement
- **1-4**: Poor — you're overpaying; fix landing page and ad relevance or pause the keyword

## Performance Max (PMax)

### What PMax Is
PMax is a single campaign type that runs across **all Google inventory**: Search, Display, YouTube, Discover, Gmail, and Maps. It uses machine learning to allocate budget and optimize creative across channels.

### Asset Groups
An asset group is like an ad group — it contains your creative assets and audience signals.

**Asset requirements per group:**
- **Text**: 5 headlines (30 char), 5 long headlines (90 char), 5 descriptions (90 char)
- **Images**: 3+ landscape (1200×628), 3+ square (1200×1200), 1+ portrait (960×1200)
- **Video**: 1+ video (if you don't provide one, Google auto-generates a terrible one — **always upload your own**)
- **Final URL**: Landing page
- **CTA**: Choose or auto

**Asset group strategy:**
- Create **separate asset groups for each product category or service line**
- Don't dump everything into one asset group
- Example for ecommerce: one asset group per product category, each with category-specific images, copy, and landing page

### Audience Signals
Audience signals are **suggestions** to PMax, not hard targeting. Google will go beyond them.

Best signals to provide:
1. **Customer lists** (purchasers, leads) — most impactful signal
2. **Website visitors** (custom segments from GA4)
3. **Custom intent** — people searching for specific terms on Google
4. **In-market audiences** — Google's pre-built intent audiences
5. **Your data segments** — remarketing lists

### When to Use PMax
✅ Use PMax when:
- Ecommerce with a product feed (PMax replaced Smart Shopping)
- You want to maximize conversions across all Google properties
- You have strong creative assets (images, video, copy)
- Account has 30+ conversions/month

❌ Don't rely solely on PMax when:
- You need granular search term control (PMax search term visibility is limited)
- B2B with complex sales cycles (PMax optimizes for volume, not quality)
- You have very limited budget (<$50/day) — not enough data to optimize across all channels

### PMax + Search Coexistence
- PMax and Search campaigns **can run simultaneously** — Search takes priority for exact match keywords
- Run **brand campaigns in Search** separately to protect brand terms (PMax will cannibalize brand if you don't)
- Run PMax for **prospecting** and monitor whether it's cannibalizing your existing Search campaigns via the Insights tab

## Shopping Campaigns

### Product Feed Optimization
Your feed is the foundation. Poor feed = poor performance.

**Critical feed fields:**
| Field | Impact | Optimization |
|---|---|---|
| Title | Highest | Front-load with primary keyword. Format: Brand + Product Type + Key Attribute + Size/Color. Example: "Nike Air Max 270 Running Shoes Men's Black Size 10" |
| Description | High | 500-1000 chars, include keywords naturally, highlight benefits |
| Product Type | High | Use your own detailed category taxonomy (up to 5 levels) |
| Google Product Category | Medium | Map to Google's taxonomy as specifically as possible |
| GTIN/MPN | Medium | Always include — enables richer listings and benchmark data |
| Image | Highest | White background for main image, lifestyle images as additional |
| Price | Highest | Competitive pricing directly impacts impression share |
| Availability | Critical | Keep in_stock/out_of_stock accurate in real-time |
| Custom Labels | High | Use for margin tiers, seasonality, bestsellers, promo eligibility |

**Custom Label strategy** (5 available: custom_label_0 through custom_label_4):
- Label 0: Margin tier (high_margin, medium_margin, low_margin)
- Label 1: Performance tier (bestseller, average, long_tail)
- Label 2: Seasonality (spring, summer, evergreen)
- Label 3: Price range (under_50, 50_to_100, over_100)
- Label 4: Promo status (on_sale, clearance, full_price)

This lets you create campaigns/asset groups segmented by business priority.

### Merchant Center Best Practices
- **Feed refresh**: Update at least daily (hourly for inventory-sensitive businesses)
- **Supplemental feeds**: Use to override/enrich primary feed data without touching your main feed
- **Feed rules**: Clean up data in Merchant Center (e.g., title prepending, price formatting)
- **Diagnostics tab**: Check weekly — disapproved products kill performance silently
- **Shipping & tax**: Configure accurately — mismatches cause disapprovals
- **Promotions**: Add sale prices and merchant promotions for "SALE" badges (15-20% CTR lift)

## YouTube Ads

### Ad Formats
**Skippable In-Stream (TrueView)**
- Plays before/during/after videos, skippable after 5 seconds
- You pay when someone watches 30 seconds (or full ad if <30s) or clicks
- **Best for**: Awareness and consideration, storytelling, product demos
- Recommended length: **30-60 seconds** (hook in first 5, CTA at 25-30s)

**Non-Skippable In-Stream**
- 15-second ads that can't be skipped
- You pay per impression (CPM)
- **Best for**: Brand awareness, reach campaigns, when your message needs full delivery
- Keep it tight: problem → solution → CTA in 15 seconds

**Bumper Ads**
- 6-second non-skippable ads
- CPM buying
- **Best for**: Reinforcement/frequency (pair with longer ads), simple single-message delivery
- One message only. Don't try to tell a story in 6 seconds.

**Video Discovery (In-Feed)**
- Thumbnail + text that appears in YouTube search results and related videos
- You pay when someone clicks to watch
- **Best for**: Driving views and subscribers, educational content, longer consideration

### YouTube Targeting
- **Custom Intent**: Target people who recently searched for specific terms on Google (most powerful for intent-based targeting)
- **In-Market**: People actively researching/comparing products in a category
- **Affinity**: Broad interest-based (good for awareness)
- **Remarketing**: Website visitors, YouTube channel engagers, customer lists
- **Placements**: Specific channels or videos (use sparingly — limits scale)
- **Topics**: Content categories (broad, use for awareness)

### YouTube Creative Best Practices
1. **Hook in first 5 seconds** — assume it's skippable; earn the watch
2. **Brand early** — mention/show brand in first 5 seconds (for awareness) or weave in naturally (for DR)
3. **Clear CTA** — verbal + visual CTA, use end screens
4. **Native feel** — overly polished ads get skipped; creator-style content works
5. **Captions** — many watch without sound

## Bidding Strategies

### Target CPA (tCPA)
- You set the average CPA you want; Google adjusts bids per auction
- **Use when**: Lead gen, app installs, or any conversion-focused campaign
- **Minimum data**: 30 conversions in last 30 days per campaign
- Set tCPA at your **actual average CPA from the last 30 days**, then gradually lower by 10-15% per week
- tCPA will **underspend** if set too aggressively — better to start high and lower

### Target ROAS (tROAS)
- You set the target return; Google optimizes for conversion value
- **Use when**: Ecommerce with variable order values, campaigns where revenue optimization matters more than volume
- **Minimum data**: 50 conversions with values in last 30 days
- Start at **80% of your actual ROAS** from last 30 days, increase gradually
- Pass accurate conversion values (revenue, not AOV) for this to work

### Maximize Conversions
- Google spends your full budget to get the most conversions possible
- **Use when**: New campaigns without enough data for tCPA, or when volume is the priority
- **Warning**: Will spend your entire daily budget regardless of CPA — set budgets carefully
- Transition to tCPA once you have 30+ conversions

### Maximize Conversion Value
- Google spends your full budget to maximize total conversion value
- **Use when**: Ecommerce, similar to above but value-focused
- Transition to tROAS once you have 50+ conversions with values

### Enhanced CPC (eCPC)
- Manual bidding with Google adjusting up/down based on conversion likelihood
- **Deprecated for most campaign types** in 2025 — use Smart Bidding instead
- Only use if you absolutely need manual bid control (rare)

### Bidding Strategy Progression
```
New campaign (0-30 conversions):
  → Maximize Conversions (budget-capped)

Building data (30-50 conversions/month):
  → Set tCPA at actual CPA, or tROAS at 80% of actual

Optimizing (50+ conversions/month):
  → Gradually tighten tCPA/tROAS targets (10-15% per adjustment, wait 2 weeks between)

Scaling:
  → Increase budget 15-20% at a time
  → Loosen tCPA/tROAS slightly when scaling to give algorithm room
```

## Conversion Tracking Setup

### Google Tag (gtag.js) + Google Tag Manager
- Install the **Google tag** on all pages (or via GTM)
- Configure conversion actions in Google Ads (not just GA4 — import GA4 goals OR create Google Ads native conversions)
- **Primary conversions** = what you optimize toward (Purchase, Lead)
- **Secondary conversions** = what you observe but don't optimize toward (Add to Cart, Page View)

### Enhanced Conversions
Enhanced conversions send hashed first-party data (email, phone, address) to Google for better attribution. **Set this up — it's the Google equivalent of Meta's CAPI.**

Setup:
1. Google Tag Manager: Use the "User-provided data" variable
2. Pass hashed email + phone on conversion pages
3. Or use **automatic enhanced conversions** (Google scrapes form data — less reliable but zero-effort)

### Offline Conversion Tracking (for Lead Gen)
Critical for B2B/lead gen — tells Google which leads actually became customers.
1. Capture GCLID on form submission (hidden field)
2. Store GCLID with lead in your CRM
3. Upload conversions (manually or via Zapier/API) when leads close
4. Google then optimizes for **quality leads**, not just form fills

**Conversion lag**: Set your conversion window to match your actual sales cycle. B2B might need 60-90 day windows.

### GA4 Integration
- Import GA4 conversions into Google Ads for broader measurement
- But use **Google Ads native conversion tracking** as your primary optimization source (more accurate for Google's bidding)
- GA4 attribution ≠ Google Ads attribution — they'll show different numbers. This is normal.

## Budget Optimization Across Campaign Types

### Budget Allocation Framework
| Campaign Type | Priority | % of Budget | Expected ROAS |
|---|---|---|---|
| Brand Search | 1 | 5-10% | 10-30× |
| Shopping/PMax (with feed) | 2 | 30-40% | 4-8× |
| Non-Brand Search (high intent) | 3 | 20-30% | 3-6× |
| Non-Brand Search (broad/discovery) | 4 | 10-15% | 2-4× |
| YouTube (DR) | 5 | 5-10% | 1-3× |
| Display Remarketing | 6 | 5-10% | 3-8× |
| YouTube (Awareness) | 7 | 0-5% | N/A (CPM metric) |

### Daily Budget Rules
- **Brand campaigns**: Uncapped (or high cap) — every brand click you miss goes to a competitor or organic
- **Shopping/PMax**: Set based on target ROAS and available inventory
- **Non-Brand Search**: Budget-cap based on CPA/ROAS targets
- **YouTube/Display**: Fixed budget for awareness; performance-based for DR

### Impression Share as a Budget Signal
- **Brand campaigns**: Target 90%+ impression share (increase budget until you hit it)
- **Non-Brand high-intent**: Target 70-80% impression share
- **Broad/discovery**: Impression share doesn't matter — let Smart Bidding decide
- Lost IS (budget) > 10% = you're leaving conversions on the table; increase budget
- Lost IS (rank) > 20% = improve Quality Score and/or increase bids

### Cross-Channel Budget Decisions
- **Google Search captures existing demand** — prioritize when there's search volume
- **Meta/TikTok creates demand** — prioritize when you need top-of-funnel
- For most DTC brands: **60% Meta / 30% Google / 10% TikTok** is a solid starting point
- Shift toward Google when branded search volume increases (sign that Meta awareness is working)
- Use **incrementality** thinking: don't just look at channel ROAS — ask "what revenue would I lose if I turned this off?"
