---
name: campaign-setup
description: End-to-end paid media campaign setup covering strategy, structure, targeting, creative direction, and tracking
triggers: [campaign, ad set, targeting, campaign setup, launch campaign, new campaign, ad group, campaign structure]
tools_required: [file-write, web-search, http-request, screenshot]
---

# Campaign Setup

When this skill activates, you are building a complete campaign plan. Follow this structured workflow.

## Phase 1: Strategic Foundation

Confirm or retrieve from memory:
1. **Business model** — E-commerce, lead gen, SaaS, local service, app install
2. **Platform** — Meta, Google, TikTok, or multi-platform
3. **Budget** — Monthly/daily spend, is this a test or scale budget?
4. **Goals** — Target CPA, ROAS, CPL, or awareness metrics
5. **Audience** — Demographics, interests, existing customer data, lookalike sources
6. **Creative assets** — What's available? Video, static, UGC, product shots?
7. **Tracking** — Pixel installed? CAPI set up? GA4 integration? UTM structure?
8. **Landing pages** — Where is traffic going? Is the page optimized for conversion?
9. **Previous campaigns** — What's been tested? What worked/failed?

## Phase 2: Campaign Architecture

### Meta Ads Structure
```
Campaign (CBO or ABO)
├── Ad Set 1: [Audience/Placement]
│   ├── Ad 1: [Creative A - Hook 1]
│   ├── Ad 2: [Creative A - Hook 2]
│   └── Ad 3: [Creative B - Hook 1]
├── Ad Set 2: [Audience/Placement]
│   └── ...
└── Ad Set 3: Retargeting
    └── ...
```

Decisions to make:
- **Campaign type:** Advantage+ Shopping (e-commerce), Manual Sales/Leads, Awareness
- **Budget structure:** CBO (let Meta distribute) vs ABO (control per audience)
- **Optimization event:** Purchase, Lead, Add to Cart, Landing Page View
- **Attribution window:** 7-day click / 1-day view (standard) or custom
- **Bid strategy:** Lowest cost (volume), Cost cap (efficiency), Bid cap (control)

### Google Ads Structure
- **Search:** STAG (single theme ad groups) with RSAs, broad match + smart bidding
- **PMax:** Asset groups by theme, audience signals, brand exclusions
- **Shopping:** Feed optimization, custom labels for margin tiers
- **Display/Demand Gen:** Remarketing audiences, managed placements

### TikTok Ads Structure
- **Smart Performance:** Full automation (test first)
- **Standard:** Manual targeting with Spark Ads or in-feed
- **Catalog:** Dynamic product ads for e-commerce

## Phase 3: Audience Strategy

Build targeting layers:

### Prospecting (Cold)
- **Broad:** No targeting restrictions, let creative and landing page signals guide the algorithm
- **Interest-based:** Relevant interests/behaviors (test with 5-10% of budget)
- **Lookalike/Similar:** From best customer lists (purchasers > leads > site visitors)

### Retargeting (Warm)
- **Website visitors:** 7-day, 14-day, 30-day windows
- **Engaged audiences:** Video viewers (25%, 50%, 75%), page/profile engagers
- **Cart abandoners:** Add to cart but no purchase (e-commerce)
- **Lead form openers:** Opened but didn't submit (lead gen)

### Exclusions
- Existing customers/purchasers (unless retention campaign)
- Converted leads (unless upsell)
- Bounced visitors (<5 seconds)

## Phase 4: Creative Brief

For each ad, specify:
1. **Format:** Static, carousel, video (length), UGC, slideshow
2. **Hook concept:** The first 1-3 seconds / headline (minimum 3 hook variants per concept)
3. **Messaging angle:** Problem/solution, social proof, before/after, educational, urgency
4. **Body copy:** PAS, AIDA, or testimonial framework
5. **CTA:** Clear, specific action (Shop Now, Get Quote, Learn More, Sign Up)
6. **Visual direction:** Style references, brand guidelines compliance
7. **Platform adaptation:** What changes per platform (aspect ratio, length, tone)

## Phase 5: Tracking & Attribution

Before launch, verify:
- [ ] Pixel/tag installed and firing correctly on all conversion events
- [ ] CAPI (Conversion API) configured for server-side tracking
- [ ] UTM parameters structured consistently
- [ ] GA4 events configured for key actions
- [ ] Attribution window set appropriately
- [ ] Test conversion tracking with a test purchase/submission
- [ ] Event Match Quality (Meta) > 6.0

## Phase 6: Launch Plan

Generate a complete campaign plan document using `file-write`:

```markdown
# Campaign Plan: [Campaign Name]
## [Client] — [Platform] — [Date]

### Objective & KPIs
- Primary goal: [CPA/ROAS/CPL target]
- Secondary metrics: [CTR, CPM, frequency]
- Budget: $[amount] / [period]

### Campaign Structure
[Detailed structure with naming conventions]

### Audience Targeting
[Each audience with rationale]

### Creative Plan
[Each ad with format, hook, angle, copy]

### Tracking Setup
[Pixel, CAPI, UTMs, attribution window]

### Launch Timeline
- Day 1-3: Learning phase, don't touch anything
- Day 4-7: Initial read, kill obvious losers
- Week 2: First optimization round
- Week 3-4: Scale winners, test new creative

### Budget Allocation
[By campaign/ad set with percentages]

### Success Criteria
[What does "working" look like at 7, 14, 30 days?]
```

## Phase 7: Memory Update

After completing the campaign plan:
1. Store campaign structure and goals in working memory
2. Store client's tracking setup and attribution model in structured memory
3. Note planned optimization checkpoints for follow-up
