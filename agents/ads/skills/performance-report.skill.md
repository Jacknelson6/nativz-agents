---
name: Performance Report & Analysis
description: Generate comprehensive paid media performance reports with actionable insights, cross-platform comparison, creative analysis, and optimization recommendations.
triggers:
  - "performance report"
  - "how are ads doing"
  - "campaign performance"
  - "ad results"
  - "weekly report"
  - "monthly report"
  - "analyze campaign"
tools_required:
  - http-request
  - file-write
  - web-search
  - stagehand-extract
  - screenshot
---

# Performance Report Workflow

## Step 1: Data Collection
- Check working memory for client's KPI targets, benchmarks, and prior report data
- Gather metrics from each active platform:
  - **Meta Ads:** Spend, impressions, reach, frequency, CPM, CPC, CTR, conversions, CPA, ROAS, purchase value
  - **Google Ads:** Spend, impressions, clicks, CTR, CPC, conversions, CPA, ROAS, search impression share, quality score
  - **TikTok Ads:** Spend, impressions, clicks, CTR, CPC, conversions, CPA, video views, avg watch time, completion rate
- Pull GA4 data for cross-platform view: sessions by source/medium, conversion paths, assisted conversions

## Step 2: Performance Analysis
1. **Top-line metrics:** Total spend, total conversions, blended CPA/ROAS across all platforms
2. **Platform comparison:** Which platform is most efficient? Where is marginal return diminishing?
3. **Campaign-level breakdown:** Performance by campaign objective (prospecting vs retargeting vs retention)
4. **Creative analysis:** Top 3 and bottom 3 creatives by CPA/ROAS — identify what's working and what's fatiguing
5. **Audience analysis:** Which audiences are outperforming? Any segments to scale or cut?
6. **Trend analysis:** WoW or MoM trends — is performance improving, stable, or declining?
7. **Budget efficiency:** Is spend pacing correctly? Any campaigns under/over-delivering?

## Step 3: Insight Generation
- Identify the #1 most important insight (the "so what" of the data)
- Connect performance changes to specific actions taken or external factors (seasonality, competitor activity, creative refresh)
- Compare actuals to targets — are we on track for monthly/quarterly goals?
- Identify statistical significance: don't over-react to small sample sizes

## Step 4: Optimization Recommendations
For each recommendation:
1. What to change (specific campaign, ad set, creative, audience, bid, budget)
2. Why (data-backed rationale)
3. Expected impact (estimated improvement in CPA/ROAS)
4. Priority (do this now vs. test next week vs. long-term strategic)

Common optimizations:
- Reallocate budget from underperforming to outperforming campaigns
- Pause fatigued creatives (rising frequency + declining CTR)
- Expand winning audiences or increase budget on winning ad sets (20% increments)
- Add negative keywords (Google) or exclude poor placements
- Test new creative angles based on what's working

## Step 5: Report Formatting
Structure the report as:
```markdown
# [Client Name] — Paid Media Performance Report
## Period: [Date Range]

### Executive Summary
[3-5 sentences: overall performance, key win, key concern, primary recommendation]

### KPI Dashboard
| Metric | This Period | Last Period | Change | Target | Status |
|--------|-----------|------------|--------|--------|--------|

### Platform Breakdown
#### Meta Ads
#### Google Ads
#### TikTok Ads

### Creative Performance
[Top performers with screenshots/descriptions, bottom performers, creative recommendations]

### Optimization Actions Taken
[What was changed this period and the result]

### Recommendations for Next Period
[Prioritized list of specific actions]
```

## Step 6: Save & Document
- Save report using `file-write`
- Store key metrics and insights in working memory for trend tracking
- Note any client-specific preferences for report format or focus areas
