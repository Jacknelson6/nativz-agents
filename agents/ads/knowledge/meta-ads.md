# Meta Ads — Expert Knowledge Base

## Campaign Structure: CBO vs ABO

### Campaign Budget Optimization (CBO)
CBO lets Meta's algorithm distribute budget across ad sets based on performance. Use CBO when:
- You have **3–5 ad sets** with similar audience sizes (overlapping is fine — Meta deduplicates at auction)
- You're in **scaling mode** and want Meta to find the cheapest conversions automatically
- Audiences are proven — you've already validated them in ABO testing

CBO rules of thumb:
- Set ad set **minimum spend** to 1× your target CPA per ad set to prevent starving
- Don't mix wildly different audience sizes (e.g., 500K LAL with 50M broad) — the algorithm will dump budget into the larger pool
- CBO needs **50+ conversions per week at the campaign level** to optimize well

### Ad Set Budget Optimization (ABO)
ABO gives you manual control over each ad set's spend. Use ABO when:
- **Testing new audiences** — you need equal spend across ad sets to get clean data
- Running **creative tests** where you want controlled variable isolation
- Working with **small budgets** (<$100/day) where CBO can't distribute meaningfully
- You have **retargeting** ad sets that need guaranteed minimum spend

### Recommended Structure (2025)
```
Campaign (CBO) — Prospecting
  ├── Ad Set: Broad (no targeting, 18-65)
  ├── Ad Set: Lookalike Stack (1-3% LAL)
  └── Ad Set: Interest Stack (layered interests)
      └── 3-6 ads per ad set

Campaign (ABO) — Retargeting
  ├── Ad Set: Website Visitors 1-7 days
  ├── Ad Set: Website Visitors 8-30 days
  ├── Ad Set: Engaged (IG + FB 90 days)
  └── Ad Set: Cart Abandoners 1-14 days

Campaign (ABO) — Creative Testing
  └── Ad Set: Proven audience, 1 variable per ad
```

## Audience Targeting

### Broad Targeting (No Interests, No LALs)
In 2025, broad is often the best performer for accounts spending $500+/day. Meta's algorithm has enough signal from your pixel, CAPI data, and ad engagement to find buyers without your help.

When to use broad:
- Account has **strong pixel data** (1,000+ purchases or leads/month)
- You're spending **$300+/day** on prospecting
- Your creative is doing the targeting (e.g., "Hey nurses!" self-selects the audience)

When broad fails:
- New pixel with <100 conversions
- Very niche B2B product
- Low daily budget where the algorithm can't explore

### Lookalike Audiences
- **1% LAL** of purchasers = your best cold audience for most accounts
- Stack LALs: create 1% LALs from purchases, high-value purchases, add-to-carts, and email lists, then put them in one ad set (Meta unions them)
- **2-5% LALs** are useful for scaling when 1% is saturated (frequency > 2.5/week)
- **Source list quality matters more than size** — 1,000 high-AOV customers > 10,000 email subscribers
- Refresh LAL source lists monthly for best results

### Interest Targeting
Use interest targeting when:
- New accounts with no pixel data
- Niche products where broad won't converge
- Testing to discover which audiences respond to your offer

Best practices:
- **Layer interests** (interest A AND interest B) to create more qualified audiences — e.g., "interested in running" AND "interested in Nike" for premium running shoes
- Keep audience size between **1M–10M** for most US campaigns
- Group similar interests into one ad set rather than splitting each into its own ad set

### Custom Audiences (Retargeting)
Priority retargeting segments by conversion rate:
1. **Cart abandoners 1-3 days** (highest intent, 8-15% CVR typical)
2. **Product viewers 1-7 days** (3-6% CVR)
3. **Website visitors 1-14 days** (1-3% CVR)
4. **IG/FB engagers 30-90 days** (0.5-1.5% CVR)
5. **Video viewers 50%+ 30 days** (0.3-1% CVR)

Retargeting budget: **10-20% of total Meta spend** for most ecommerce accounts. If retargeting ROAS is <2× prospecting ROAS, you're likely over-investing in retargeting (it's cannibalizing organic conversions).

## Creative Best Practices

### The Hook (First 1-3 Seconds)
The hook is 80% of your ad's performance. Types that work:
- **Pattern interrupt**: Unexpected visual or sound that stops the scroll. Hand reaching toward camera, loud sound effect, something falling.
- **Bold claim**: "We spent $2M on Meta Ads last year. Here's what actually works."
- **Question**: "Why is everyone switching to [product]?"
- **Social proof**: "50,000 people bought this in the first week."
- **Before/After**: Visual transformation (must comply with Meta's policies — no misleading before/after for health/beauty)

### UGC (User-Generated Content)
UGC outperforms polished brand content for most DTC brands at the consideration/conversion stage. Key elements:
- **Authentic setting** (kitchen, bathroom, car — not a studio)
- **Direct-to-camera** talking head
- **Problem → solution → result** narrative arc
- **15-30 seconds** optimal length (60s max for high-ticket)
- Film in **9:16** for placements; Meta will crop for feed

UGC creator briefing template:
1. Hook (scripted — don't let creators wing this)
2. Problem statement (relatable pain point)
3. Product introduction (natural, not salesy)
4. Key benefit (one, not three)
5. Social proof or result
6. CTA

### Static vs Video
- **Video** wins for prospecting cold audiences (higher engagement, more data for algorithm)
- **Static** wins for retargeting (product-focused, less friction)
- **Carousel** wins for multi-product catalogs and "listicle" style ads
- Always run both — let the algorithm decide per placement

### Aspect Ratios
- **9:16** (1080×1920): Stories, Reels, TikTok placements — **mandatory** in 2025
- **1:1** (1080×1080): Feed, right column, Audience Network
- **4:5** (1080×1350): Facebook Feed (takes up more screen real estate than 1:1)
- Upload all three ratios per ad using Meta's asset customization. Never let Meta auto-crop.

### Creative Volume
- Launch **3-5 new creatives per week** for accounts spending $1K+/day
- **Kill creatives** when frequency > 3 and CPA is 30%+ above target for 3+ days
- **Iterate winners** — take your best performer, change the hook, keep the body. Change the body, keep the hook. Test variations.

## Bidding Strategies

### Lowest Cost (Default)
- Meta spends your full budget to get the most conversions at the lowest possible cost
- **Use when**: Starting out, learning phase, or when you just want maximum volume
- **Downside**: CPA fluctuates, especially during high-competition periods (Q4, BFCM)

### Cost Cap
- You set a target CPA; Meta tries to stay at or below it
- **Use when**: You have a firm CPA target for profitability (e.g., "I can't pay more than $40/lead")
- Set cost cap at **your actual target CPA**, not lower — Meta will underspend if you set it too tight
- Expect **20-30% less spend** than your budget; Meta won't force spend if it can't hit your cap
- Best for **scaling** — increase budget without CPA blowing up

### Bid Cap
- Hard ceiling on what Meta bids per auction
- **Use when**: You understand auction dynamics and want maximum control (rare — mostly for agencies managing large spend)
- Requires constant monitoring; can cause severe underspend
- Set bid cap at **~20% above your target CPA** to win enough auctions

### Minimum ROAS
- Only available for purchase optimization
- **Use when**: You have variable AOVs and need to maintain return thresholds
- Set at **80% of your actual target ROAS** to give the algorithm room

## Pixel Setup & CAPI

### Pixel (Browser-Side)
Standard events to configure (in priority order):
1. `Purchase` (with value and currency — **required** for ROAS optimization)
2. `AddToCart`
3. `InitiateCheckout`
4. `ViewContent`
5. `Lead` / `CompleteRegistration` (for lead gen)
6. `PageView` (auto-fires with base pixel)

### Conversions API (CAPI) — Server-Side
CAPI sends events directly from your server to Meta, bypassing browser restrictions (iOS 14.5+, ad blockers, cookie deprecation). **CAPI is not optional in 2025 — it's mandatory for accurate tracking.**

Setup options:
- **Shopify native integration** — one-click, handles deduplication automatically
- **Google Tag Manager server-side** — more control, requires cloud hosting ($50-100/mo)
- **Direct API integration** — most control, requires developer resources
- **Partner integrations** (Stape, Elevar, Triple Whale) — easiest for non-Shopify

Deduplication: Send the same `event_id` from both pixel and CAPI. Meta deduplicates automatically. If you don't deduplicate, you'll see inflated conversion counts.

**Event Match Quality (EMQ)**: Target **7+/10** for each event. Improve EMQ by passing:
- Email (hashed) — biggest impact
- Phone (hashed)
- First name, last name (hashed)
- External ID
- IP address, user agent, fbc, fbp cookies

## Attribution Windows & Measurement

### Attribution Windows
- **7-day click** is the default and what Meta optimizes for
- **1-day view** captures people who saw your ad and converted within 24 hours without clicking
- **7-day click, 1-day view** is the standard reporting window for most advertisers

Understanding view-through attribution:
- View-through conversions are real but inflated — Meta counts anyone who *saw* your ad and converted, even if they would have converted anyway
- For **accurate ROAS**: report on 7-day click only
- For **algorithm optimization**: keep 7-day click + 1-day view (gives Meta more signal)

### Measurement Beyond Meta's Reporting
Meta's reported ROAS is **not your real ROAS**. Always cross-reference:
- **Shopify/backend revenue** vs Meta reported revenue (Meta typically over-reports by 20-40%)
- **UTM tracking** in Google Analytics 4 (last-click model, will under-count Meta)
- **Post-purchase surveys** ("How did you hear about us?") — cheap, directional, valuable
- **Incrementality testing** (Meta's Conversion Lift, or geo-based holdout tests) — gold standard but requires $10K+/mo spend
- **Marketing mix modeling (MMM)** for large accounts ($100K+/mo) — Robyn (Meta's open-source MMM) or Meridian (Google's)

Realistic ROAS benchmarks (ecommerce, blended):
- **Prospecting**: 1.5–3× (varies by AOV and margin)
- **Retargeting**: 5–15× (inflated by attribution)
- **Blended (all campaigns)**: 3–6× for healthy DTC brands
- **Break-even ROAS** = 1 / gross margin (e.g., 60% margin = 1.67× break-even)

## Common Mistakes and Fixes

### 1. Editing Ads in Active Ad Sets
**Mistake**: Changing creative, copy, or targeting on a running ad resets learning phase.
**Fix**: Duplicate the ad set, make changes in the duplicate, pause the original once the new one exits learning.

### 2. Too Many Ad Sets (Audience Fragmentation)
**Mistake**: Running 15 ad sets with $20/day each — none exit learning phase.
**Fix**: Consolidate into 3-5 ad sets. Each ad set needs **~50 conversions/week** to optimize.

### 3. Killing Ads Too Early
**Mistake**: Turning off an ad after 1-2 days because CPA is high.
**Fix**: Wait for **at least 50 conversion events** (or the full learning phase) before judging. Minimum 3-5 days, ideally 7.

### 4. Retargeting Overlap with Prospecting
**Mistake**: Not excluding retargeting audiences from prospecting campaigns.
**Fix**: Exclude website visitors (180 days), purchasers (180 days), and engaged audiences from all prospecting ad sets. (Note: with Advantage+ Shopping, you can't exclude — use the "existing customer budget cap" instead.)

### 5. Ignoring Creative Fatigue
**Mistake**: Running the same 3 ads for months.
**Fix**: Monitor **frequency** (>2.5 for prospecting = fatigued) and **CTR trends** (declining CTR = fatigue). Refresh creatives weekly.

### 6. Wrong Optimization Event
**Mistake**: Optimizing for `AddToCart` or `ViewContent` when you have enough purchase data.
**Fix**: Always optimize for the **lowest-funnel event** you can get 50+/week of. Purchase > AddToCart > ViewContent > Landing Page View.

### 7. Not Using Advantage+ Shopping Campaigns (ASC)
**Mistake**: Ignoring ASC because you want manual control.
**Fix**: ASC consistently outperforms manual campaigns for ecommerce. Run ASC alongside manual campaigns. Allocate 30-50% of budget to ASC. Set existing customer cap to 20-30%.

## Budget Allocation Framework

### For a New Account ($3K–$10K/month)
| Campaign Type | % of Budget |
|---|---|
| Prospecting (CBO, broad + LAL) | 60% |
| Creative Testing (ABO) | 20% |
| Retargeting (ABO) | 15% |
| Advantage+ Shopping | 5% (test) |

### For a Scaling Account ($10K–$50K/month)
| Campaign Type | % of Budget |
|---|---|
| Advantage+ Shopping | 40% |
| Prospecting (CBO, broad) | 25% |
| Creative Testing (ABO) | 20% |
| Retargeting (ABO) | 15% |

### For a Mature Account ($50K+/month)
| Campaign Type | % of Budget |
|---|---|
| Advantage+ Shopping | 50-60% |
| Prospecting (CBO, broad) | 15-20% |
| Creative Testing (ABO) | 15-20% |
| Retargeting (ABO) | 10% |

### Scaling Rules
- Increase budgets by **no more than 20% every 3 days** on performing campaigns
- If CPA spikes >30% after a budget increase, revert and try a smaller increase
- For aggressive scaling: **duplicate the campaign** at higher budget rather than increasing existing
- Horizontal scaling: launch new creatives and new audience variations rather than pumping more money into the same ad sets
- **Vertical scaling** (budget increases) has a ceiling; **horizontal scaling** (more campaigns/creatives) is how you get past it
