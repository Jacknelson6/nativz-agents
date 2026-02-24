# Paid Media Strategy — Expert Knowledge Base

## Cross-Platform Budget Allocation

### Starting Framework by Business Type

**DTC Ecommerce (proven product-market fit)**
| Platform | % of Budget | Role |
|---|---|---|
| Meta (FB/IG) | 50-60% | Primary conversion driver, full funnel |
| Google (Search + Shopping) | 25-35% | Capture existing demand, brand defense |
| TikTok | 10-20% | Top-of-funnel awareness, creative testing |

**Lead Generation (B2B or local services)**
| Platform | % of Budget | Role |
|---|---|---|
| Google Search | 50-60% | High-intent capture |
| Meta | 25-35% | Demand generation, retargeting |
| LinkedIn | 10-15% | B2B targeting (high CPMs but qualified) |
| TikTok | 0-10% | Only if audience skews young |

**App / Mobile-First**
| Platform | % of Budget | Role |
|---|---|---|
| Meta | 40-50% | Install volume, retargeting |
| TikTok | 20-30% | Install volume, younger demographic |
| Google (UAC/ACe) | 20-30% | Search + Play Store + YouTube |
| Apple Search Ads | 5-10% | High-intent iOS installs |

### Rebalancing Signals
Shift budget **toward** a platform when:
- Marginal CPA is lower than other platforms (compare last 14 days)
- Creative is performing well and hasn't fatigued
- Platform-specific seasonality favors it (e.g., Google during high-search-intent periods like BFCM)

Shift budget **away** when:
- Frequency is high (>3/week on Meta, >2/week on TikTok)
- CPA has risen 30%+ without creative changes
- You've exhausted viable audiences at current creative volume

### The 70/20/10 Rule
- **70%** of budget on proven, scaling campaigns
- **20%** on promising campaigns being optimized
- **10%** on experimental tests (new platforms, new formats, new audiences)

## Full-Funnel Strategy

### Awareness (Top of Funnel)
**Goal**: Reach new audiences, build brand familiarity, generate demand
**Platforms**: TikTok, YouTube, Meta (broad/interest targeting), Display
**KPIs**: CPM, Reach, Video View Rate (VVR), ThruPlay Rate, Brand Lift
**Content**: Entertaining, educational, problem-aware. Not product-focused.
**Budget**: 20-30% of total spend

Tactics:
- TikTok Spark Ads from creators (broadest reach, lowest CPMs)
- YouTube TrueView ads (30-60s, storytelling)
- Meta Reels/Stories ads with broad targeting
- Influencer whitelisting (run ads from creator accounts)

### Consideration (Middle of Funnel)
**Goal**: Educate, build trust, move warm audiences toward conversion intent
**Platforms**: Meta (engaged audiences), YouTube (custom intent), Google Display (remarketing)
**KPIs**: CTR, CPC, Landing Page Views, Engagement Rate, Add to Cart Rate
**Content**: Product demos, testimonials, UGC reviews, comparison content, FAQs
**Budget**: 15-25% of total spend

Tactics:
- Retarget video viewers (50%+ watch) and social engagers (30-90 days)
- Website visitor retargeting (non-converters, 1-30 days)
- Email subscriber lookalikes
- YouTube custom intent (target people who searched your category on Google)

### Conversion (Bottom of Funnel)
**Goal**: Drive purchases, signups, leads from high-intent audiences
**Platforms**: Google Search, Meta retargeting, Shopping/PMax
**KPIs**: CPA, ROAS, Conversion Rate, AOV
**Content**: Offers, urgency, social proof, reviews, guarantees, pricing
**Budget**: 50-60% of total spend

Tactics:
- Google branded + high-intent non-branded search
- Shopping/PMax campaigns
- Meta retargeting: cart abandoners (1-7 days), product viewers (1-14 days)
- Dynamic product ads (DPA) on Meta
- Email/SMS retargeting for abandoned carts (not paid media but critical to mention)

### Retention / Post-Purchase
**Goal**: Repeat purchases, LTV maximization, referrals
**Platforms**: Meta (custom audiences), Google (RLSA), Email/SMS
**KPIs**: Repeat purchase rate, LTV, referral rate
**Budget**: 5-10% of total spend

Tactics:
- Exclude recent purchasers (7-14 days) from prospecting
- Create campaigns targeting past purchasers with new products, upsells, cross-sells
- Use customer lists for lookalike seed audiences

## Attribution Modeling

### Last-Click Attribution
- Credits the final touchpoint before conversion
- **Default in GA4** (data-driven is also available)
- **Bias**: Over-credits Google Search and brand campaigns; under-credits awareness channels
- Useful as a **floor metric** — if something looks good on last-click, it's definitely working

### Platform Self-Attribution
Each platform counts conversions it touched within its attribution window.
- **Meta**: 7-day click, 1-day view (default)
- **Google**: 30-day click (default), data-driven model
- **TikTok**: 7-day click, 1-day view (default)

**The overlap problem**: A user sees a TikTok ad, then clicks a Meta ad, then searches your brand on Google. All three platforms claim the conversion. Your reported ROAS sum is 3× actual ROAS.

### Data-Driven Attribution (DDA)
Available in GA4 and Google Ads. Uses machine learning to distribute credit across touchpoints based on their actual impact.
- Better than last-click for multi-channel advertisers
- Still biased toward measurable touchpoints (misses view-through, cross-device)
- **Requires 300+ conversions and 3,000+ interactions** in 30 days to work in GA4

### Incrementality Testing (Gold Standard)
Incrementality answers: "What revenue would I lose if I turned this off?"

**Methods:**
1. **Geo holdout tests**: Turn off ads in matched geographic regions, compare conversion lift vs. control
   - Requires $10K+/mo spend and 4-6 weeks
   - Most accurate method for most advertisers
2. **Conversion lift (Meta/Google)**: Platform-native A/B test between exposed and holdout groups
   - Free to run but uses platform's own measurement
3. **Ghost ads / PSA tests**: Show a public service announcement instead of your ad to a holdout group, measure difference
4. **Budget on/off tests**: Pause a campaign for 2 weeks, measure total business revenue impact
   - Crude but effective for high-spend channels

### Marketing Mix Modeling (MMM)
Statistical model that quantifies each channel's contribution to total revenue.
- **Best for**: Large advertisers ($100K+/mo) with 2+ years of data
- Tools: Robyn (Meta's open-source), Meridian (Google's), Recast, Measured
- Accounts for offline factors (seasonality, TV, PR, weather, promotions)
- Updated quarterly (not real-time — use for strategic allocation, not daily optimization)

### Practical Attribution Stack
| Method | Cost | Accuracy | Speed | Best For |
|---|---|---|---|---|
| Post-purchase survey | Free | Directional | Immediate | Qualitative channel mix |
| UTM/last-click (GA4) | Free | Low-medium | Real-time | Daily optimization floor |
| Platform reporting | Free | Inflated | Real-time | Per-platform optimization |
| Triple Whale / Northbeam | $200-2000/mo | Medium-high | Real-time | Blended attribution |
| Incrementality tests | Staff time | High | 4-6 weeks | Channel-level decisions |
| MMM | $5K-50K setup | Highest | Quarterly | Strategic budget allocation |

## Reporting Frameworks

### Key Metrics & Benchmarks (US, 2025)

**Ecommerce**
| Metric | Good | Great | Red Flag |
|---|---|---|---|
| Blended ROAS | 3-5× | 6-10× | <2× |
| Meta CPA | $20-50 | <$20 | >$75 |
| Google CPA (non-brand) | $15-40 | <$15 | >$60 |
| Meta CPM | $10-20 | <$10 | >$30 |
| CTR (Meta) | 1-2% | >2% | <0.8% |
| CTR (Google Search) | 5-10% | >10% | <3% |
| Landing Page CVR | 2-4% | >4% | <1.5% |
| AOV | Varies | Trending up | Declining |

**Lead Generation**
| Metric | Good | Great | Red Flag |
|---|---|---|---|
| CPL (Meta) | $15-50 | <$15 | >$75 |
| CPL (Google Search) | $20-80 | <$20 | >$100 |
| Lead-to-Sale Rate | 10-20% | >20% | <5% |
| Cost per Qualified Lead | $50-200 | <$50 | >$300 |
| CTR (Meta) | 0.8-1.5% | >1.5% | <0.5% |
| Form Completion Rate | 20-40% | >40% | <15% |

**Brand Awareness**
| Metric | Target |
|---|---|
| CPM | $5-15 |
| Video View Rate (TikTok) | >15% |
| ThruPlay Rate (Meta) | >20% |
| YouTube VTR (30s) | >25% |
| Brand Search Lift | 10-30% increase |

### Weekly Report Structure
1. **Headline numbers**: Spend, Revenue, ROAS (or Leads, CPL) — this week vs last week vs same week last year
2. **Platform breakdown**: Performance by platform with trend arrows
3. **Top/bottom performers**: Best and worst campaigns, ad sets, or creatives
4. **Actions taken**: What you changed this week and why
5. **Plan for next week**: What you'll test, launch, or adjust

### Monthly Report Structure
1. **Executive summary**: 3-sentence overview of performance vs goals
2. **KPI dashboard**: All key metrics trended over time (month-over-month, year-over-year)
3. **Channel analysis**: Each platform's performance, contribution, and efficiency
4. **Creative analysis**: Top-performing creatives, themes, and fatigue signals
5. **Audience insights**: Which audiences converted best, new audience discoveries
6. **Budget utilization**: Planned vs actual spend, where budget shifted and why
7. **Competitive landscape**: Any notable competitor activity
8. **Recommendations**: 3-5 specific actions for next month with expected impact

## Testing Frameworks

### Creative Testing
The **#1 lever** for paid media performance. Your targeting is only as good as your creative.

**Testing methodology:**
1. **Isolate one variable**: Hook, body, CTA, format, creator, or angle
2. **Use ABO with equal budgets**: $20-50/day per ad, minimum 3-5 days
3. **Winning criteria**: Primary metric (CPA or ROAS) + secondary (CTR, hook rate)
4. **Statistical significance**: Need ~100 conversions total across variants for 90% confidence, but in practice, directional reads at 50+ conversions work
5. **Kill losers fast**: After 2× your target CPA in spend with no conversions, kill it

**Creative testing cadence:**
- Test **3-5 new concepts per week** for accounts spending $5K+/mo
- Graduate winners to scaling campaigns
- Iterate on winners: 60% iterations of proven concepts, 40% net-new concepts

### Audience Testing
Less impactful than creative testing in 2025 (algorithms are better at finding audiences), but still valuable.

**Test structure:**
- Use the **same creative** across all audience ad sets
- Test one audience variable at a time (broad vs LAL vs interest)
- Run for 7-14 days minimum
- Winner = lowest CPA at meaningful scale

### Budget Testing
- **Incrementality tests**: Is this channel/campaign actually driving new revenue?
- **Budget elasticity**: At what spend level does marginal CPA start increasing?
- Test by increasing budget 20% and measuring CPA over 7 days. If CPA rises <10%, increase again. If CPA rises >20%, you've found the ceiling.

## Scaling Rules

### When to Scale a Campaign
✅ Scale when:
- CPA is **20%+ below target** for 7+ consecutive days
- Creative hasn't fatigued (frequency <2.5, CTR stable)
- You have **budget headroom** (not limited by daily cap)
- The campaign has **exited learning phase** (50+ conversions/week)

### How to Scale
1. **Increase budget 20% every 3-5 days** (conservative, recommended)
2. **Duplicate at higher budget** (faster, more aggressive — works well on Meta)
3. **Expand audiences** (add new LALs, broaden interests, go broad)
4. **Launch new creatives** into the winning campaign (horizontal scaling)
5. **Expand to new platforms** (if crushing Meta, test TikTok with winning concepts)

### When to Kill a Campaign
🛑 Kill when:
- CPA is **50%+ above target for 5+ days** after exiting learning phase
- **Frequency >4** and rising (audience saturated)
- CTR has declined **50%+ from launch** (creative fatigue)
- No conversions after spending **3× your target CPA** (the creative/audience doesn't work)
- ROAS is below **break-even** (1 / gross margin) for 7+ days

### Kill Hierarchy
Before killing a campaign entirely, try these fixes in order:
1. **Refresh creatives** — add 3-5 new ads (most common fix)
2. **Adjust bid strategy** — switch from Lowest Cost to Cost Cap
3. **Narrow targeting** — remove underperforming audiences
4. **Reduce budget** by 30-50% to improve efficiency
5. **Pause underperforming ad sets** (keep the campaign, kill the dead weight)
6. **Kill the campaign** only after steps 1-5 fail

### Scaling Ceilings & How to Break Them
| Ceiling | Signal | Solution |
|---|---|---|
| Creative fatigue | Rising frequency, declining CTR | New creative concepts, new creators, new formats |
| Audience saturation | Rising CPMs, declining reach | Expand to broader audiences, new platforms |
| Platform ceiling | Diminishing returns on budget increases | Add new platform or channel |
| Offer ceiling | High CTR but low CVR | Test new offers, pricing, landing pages |
| Funnel ceiling | Traffic converts but AOV/LTV is low | Upsells, bundles, subscription offers |
