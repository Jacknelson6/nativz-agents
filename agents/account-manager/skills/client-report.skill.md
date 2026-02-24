---
name: Client Report Generation
description: Build comprehensive monthly and quarterly client performance reports covering all active channels with executive summaries, KPI dashboards, insights, and strategic recommendations.
triggers:
  - "build a client report"
  - "monthly report"
  - "quarterly report"
  - "performance report for"
  - "client update"
  - "prepare the report"
tools_required:
  - file-write
  - http-request
  - web-search
---

# Client Report Generation Workflow

## Step 1: Context & Data Gathering
- Check working memory for client's KPI targets, report format preferences, and prior report data
- Identify all active channels for this client: SEO, paid media, social, content, email, web dev
- Gather performance data from each channel team or platform
- Pull comparison data: month-over-month, year-over-year, vs targets

## Step 2: Executive Summary Drafting
- Write 3-5 sentences summarizing overall performance
- Highlight the #1 win and the #1 area of concern
- Include primary KPIs with directional trend (up/down/flat)
- Set the strategic tone for the rest of the report

## Step 3: KPI Dashboard
Build a table with traffic-light status indicators:
| KPI | Target | Actual | vs Target | MoM Change | Status |
|-----|--------|--------|-----------|------------|--------|
Use 🟢 (on/above target), 🟡 (within 10%), 🔴 (below target)

## Step 4: Channel-by-Channel Analysis
For each active channel:
1. Key metrics for the period
2. Activities completed (deliverables, campaigns launched, content published)
3. What worked — with supporting data
4. What underperformed — with honest explanation
5. Recommendations for next period

## Step 5: Strategic Insights
- Competitive intelligence: any notable competitor movements
- Market/industry trends affecting the client
- Opportunities identified for next quarter
- Risks or concerns to flag proactively

## Step 6: Next Period Plan
- Prioritized list of initiatives by expected impact
- Timeline and milestones
- Client action items or approvals needed
- Budget considerations if applicable

## Step 7: Review & Delivery
- [ ] All data points are accurate and sourced
- [ ] Insights explain "so what" — not just numbers
- [ ] Tone is confident and consultative, not defensive
- [ ] Report matches client's preferred format (check memory)
- [ ] Executive summary works as a standalone read for C-level
- [ ] Action items are clearly delineated (our team vs. client team)
- Save report and store key insights in working memory for trend tracking
