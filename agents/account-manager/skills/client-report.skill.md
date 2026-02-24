---
name: client-report
description: Generate professional client-facing reports with KPIs, insights, and strategic recommendations
triggers: [report, update, status, monthly report, weekly update, performance report, client report, status update]
tools_required: [file-write, http-request, web-search]
---

# Client Report

When this skill activates, you are generating a client-facing report. Follow this workflow.

## Phase 1: Context & Data

Confirm or retrieve from memory:
1. **Client** — Check structured memory for communication preferences, stakeholder names, report format preferences
2. **Report type** — Weekly update, monthly report, quarterly review, ad-hoc status
3. **Services** — What channels/services are we reporting on? (SEO, Paid Media, Social, Content)
4. **KPIs** — What are the agreed-upon metrics? Check memory for targets.
5. **Data period** — What dates does this report cover?
6. **Previous report** — Check working memory for last period's data for comparison

## Phase 2: Data Organization

### Metrics Framework
For each service channel, organize:

**SEO:**
- Organic sessions (GA4)
- Keyword rankings (position changes)
- Organic conversions/revenue
- Technical health score
- Backlinks acquired

**Paid Media:**
- Spend vs budget
- CPA/ROAS vs target
- Impressions, clicks, CTR
- Conversions
- Creative performance highlights

**Social Media:**
- Follower growth
- Engagement rate
- Content performance (top posts)
- Reach/impressions
- Community metrics (comments, DMs, sentiment)

**Content:**
- Pieces published vs plan
- Content performance metrics
- SEO impact of content
- Engagement by content type

### Status Indicators
- 🟢 On/above target
- 🟡 Within 10% of target
- 🔴 Below target by >10%

## Phase 3: Insight Development

For every data point, answer the "So What?":
1. **What happened?** — State the metric
2. **Why?** — Explain the cause (seasonal, campaign change, algorithm update, competitive shift)
3. **So what?** — What does this mean for the business?
4. **Now what?** — What action are we taking?

### Insight Quality Standards
- Never report a metric without context
- Always compare to: target, previous period, same period last year (when available)
- Lead with positive momentum, address underperformance proactively
- Connect tactical metrics to business outcomes ("15% more organic traffic = ~$12K additional revenue based on historical conversion rates")

## Phase 4: Report Generation

### Weekly Update (Email)
```
Subject: [Client Name] — Weekly Update [Date Range]

Hi [Name],

Here's your weekly update:

📊 Key Metrics
- [Metric 1]: [Value] ([trend vs last week])
- [Metric 2]: [Value] ([trend])

✅ Completed This Week
- [Deliverable 1]
- [Deliverable 2]

🔄 In Progress
- [Task] — ETA: [Date]

📋 Next Week's Priorities
- [Priority 1]
- [Priority 2]

⚠️ Items Needing Your Input
- [Decision/approval needed]

Best,
[Name]
```

### Monthly Report (Document)
```markdown
# [Client Name] — [Month Year] Performance Report

## Executive Summary
[3-5 sentences: overall performance vs goals, top wins, key concern, strategic direction for next month]

## KPI Dashboard
| Metric | Actual | Target | vs Target | MoM Change | YoY Change | Status |
|--------|--------|--------|-----------|------------|------------|--------|

## [Channel] Performance
### Key Metrics
[Channel-specific data with visualization direction]

### Activities & Deliverables
[What was done this month]

### What Worked
[Data-backed wins]

### Areas for Improvement
[Honest assessment with action plan]

### Recommendations
[Prioritized next steps]

## Competitive Landscape
[Any notable competitor moves or market shifts]

## Next Month Plan
| Priority | Deliverable | Expected Impact | Timeline |
|----------|------------|-----------------|----------|

## Client Action Items
- [ ] [Item needing client decision] — Due: [Date]
```

### Quarterly Business Review (Presentation Outline)
```markdown
# [Client Name] — Q[X] [Year] Business Review

## Agenda
1. Quarterly Performance Summary (10 min)
2. Goal Progress (10 min)
3. Key Wins & Learnings (10 min)
4. Strategic Recommendations for Next Quarter (15 min)
5. Discussion & Q&A (15 min)

## Quarterly Summary
[High-level performance with quarterly trend]

## Goal Tracker
| Annual Goal | Q[X] Target | Q[X] Actual | On Track? |
|-------------|------------|-------------|-----------|

## Top 3 Wins
[Each with data and business impact]

## Key Learnings
[What we learned and how we're applying it]

## Next Quarter Strategy
[Strategic priorities with rationale and expected outcomes]

## Budget & Investment
[Current spend, recommended changes, ROI projections]
```

## Phase 5: Memory Update

1. Store this period's key metrics in working memory for next period comparison
2. Store any new client preferences about report format in structured memory
3. Note follow-up items and their due dates
4. Record any strategic decisions made during report review
