---
name: performance-report
description: Paid media performance analysis and reporting with actionable optimization recommendations
triggers: [report, ROAS, performance, metrics, analytics, optimization, results, spend, CPA, CPL, CTR]
tools_required: [file-write, web-search, http-request, browse-page, screenshot]
---

# Performance Report

When this skill activates, you are analyzing paid media performance and generating an actionable report.

## Phase 1: Data Collection

Gather performance data from available sources:

### Key Metrics to Collect
| Metric | Meta | Google | TikTok |
|--------|------|--------|--------|
| Spend | ✓ | ✓ | ✓ |
| Impressions | ✓ | ✓ | ✓ |
| Clicks | ✓ | ✓ | ✓ |
| CTR | ✓ | ✓ | ✓ |
| CPC | ✓ | ✓ | ✓ |
| CPM | ✓ | ✓ | ✓ |
| Conversions | ✓ | ✓ | ✓ |
| CPA/CPL | ✓ | ✓ | ✓ |
| ROAS | ✓ | ✓ | ✓ |
| Frequency | ✓ | - | ✓ |

Use `browse-page` or `http-request` to pull data from dashboards or APIs. Use `screenshot` to capture dashboard states for the report.

Check working memory for previous performance data to enable period-over-period comparison.

## Phase 2: Analysis Framework

### 2.1 Top-Level Performance
- Total spend vs budget (pacing)
- Overall CPA/ROAS vs target
- Trend direction (improving, declining, stable)
- Comparison vs previous period (WoW, MoM)

### 2.2 Campaign-Level Breakdown
For each campaign:
- Spend and share of budget
- Primary KPI performance
- Is it in learning phase?
- Should budget increase, decrease, or hold?

### 2.3 Creative Analysis
- Top performing creatives by primary KPI
- Creative fatigue indicators (rising frequency, declining CTR, increasing CPM)
- Creative format performance (video vs static vs carousel)
- Hook performance (which hooks drive engagement)

### 2.4 Audience Analysis
- Best performing audiences
- Audience overlap issues
- Retargeting pool sizes and performance
- New vs returning customer split (if available)

### 2.5 Platform Comparison (Multi-Platform)
- CPA/ROAS by platform
- Marginal efficiency (which platform deserves more budget?)
- Attribution overlap considerations

## Phase 3: Optimization Recommendations

For each finding, provide:
1. **What** — specific change to make
2. **Why** — data supporting the recommendation
3. **Expected impact** — quantified improvement estimate
4. **Priority** — Do now / This week / Next cycle

Common optimization actions:
- Kill underperforming ad sets/creatives (>2x target CPA after 2x conversion window)
- Scale winners (increase budget 20% every 3-5 days)
- Refresh fatiguing creatives (frequency >3, CTR declining >20%)
- Add negative keywords (Google Search)
- Exclude low-quality placements
- Adjust bid strategy or targets
- Reallocate budget between campaigns/platforms
- Test new audiences or expand lookalikes

## Phase 4: Report Generation

Generate using `file-write`:

```markdown
# Paid Media Performance Report
## [Client] — [Period] — [Date]

### Executive Summary
[3-5 sentences: spend, primary KPI performance vs target, key wins, key concerns, strategic direction]

### Performance Dashboard
| Metric | This Period | Last Period | Change | Target | Status |
|--------|-----------|------------|--------|--------|--------|
| Spend | $X | $X | +X% | $X | 🟢/🟡/🔴 |
| CPA | $X | $X | -X% | $X | 🟢/🟡/🔴 |
| ROAS | X.Xx | X.Xx | +X% | X.Xx | 🟢/🟡/🔴 |
| Conversions | X | X | +X% | X | 🟢/🟡/🔴 |

### Campaign Performance
[Per-campaign breakdown]

### Creative Performance
[Top/bottom creatives with performance data]

### Audience Insights
[Best audiences, fatigue signals]

### Optimization Actions
[Prioritized list with expected impact]

### Budget Recommendation
[Proposed allocation for next period with rationale]

### Next Steps
[Specific actions with owners and timelines]
```

## Phase 5: Memory Update

1. Store current performance benchmarks in working memory for next period comparison
2. Store client's target metrics and budget in structured memory
3. Note creatives that need replacement and when
4. Record optimization actions taken for follow-up tracking
