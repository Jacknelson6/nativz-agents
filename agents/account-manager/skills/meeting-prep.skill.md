---
name: meeting-prep
description: Prepare comprehensive meeting agendas, talking points, and follow-up templates for client meetings
triggers: [meeting, agenda, prep, meeting prep, call prep, client call, client meeting, review call]
tools_required: [file-write, http-request, web-search]
---

# Meeting Prep

When this skill activates, you are preparing for a client meeting. Follow this workflow.

## Phase 1: Meeting Context

Confirm or retrieve from memory:
1. **Client** — Check structured memory for stakeholder names, communication style, past meeting notes
2. **Meeting type** — Weekly sync, monthly review, quarterly business review, kickoff, strategy session, escalation
3. **Attendees** — Who's joining from client side? From our side? (Adjust formality/depth accordingly)
4. **Duration** — How much time do we have?
5. **Key topics** — Any specific topics the client requested or issues that need addressing?
6. **Previous meeting** — Check working memory for action items from last meeting

## Phase 2: Pre-Meeting Research

### Data Review
- Pull latest performance metrics for the client's campaigns
- Check progress on all outstanding action items
- Identify any metrics that have significantly changed (up or down)
- Note any platform changes, algorithm updates, or industry news relevant to the client

### Anticipate Client Questions
Based on the data and client history, prepare answers for:
- "Why did [metric] go down/up?"
- "What about competitor [X]?"
- "When will we see results from [recent initiative]?"
- "Can we increase/decrease budget?"
- "What's the plan for next month/quarter?"

Store anticipated Q&A in working memory for reference during the meeting.

## Phase 3: Agenda Creation

### Standard Weekly Sync (30 min)
```markdown
# [Client Name] — Weekly Sync
## [Date] | [Time] | [Duration]

### Attendees
- [Our team]: [Names and roles]
- [Client team]: [Names and roles]

### Agenda

1. **Quick Wins & Highlights** (5 min)
   - [Win 1 — with data]
   - [Win 2]

2. **Performance Snapshot** (10 min)
   - [Primary KPI]: [Value] vs [Target]
   - [Secondary KPI]: [Value] vs [Last Week]
   - Key takeaway: [One-sentence insight]

3. **Project Updates** (10 min)
   - [Project 1]: [Status] — [Next milestone and ETA]
   - [Project 2]: [Status] — [Blocker if any]

4. **Discussion Item** (5 min)
   - [Strategic question or decision needed]
   - Our recommendation: [X] because [reason]

5. **Action Items & Next Steps** (5 min)
   - Review action items from last meeting
   - Assign new action items

### Pre-Read
[Any documents or data the client should review before the call]
```

### Monthly Review (60 min)
```markdown
# [Client Name] — Monthly Performance Review
## [Date] | [Time] | 60 min

### Attendees
[Names and roles]

### Agenda

1. **Month in Review** (10 min)
   - Executive summary of performance
   - KPI dashboard review

2. **Channel Deep Dive** (20 min)
   - [Channel 1]: Performance, activities, learnings
   - [Channel 2]: Performance, activities, learnings

3. **Creative/Content Review** (10 min)
   - Top performing content/creatives
   - Content pipeline for next month

4. **Strategic Discussion** (15 min)
   - [Key strategic topic — e.g., budget reallocation, new channel test, campaign concept]
   - Data supporting the recommendation
   - Decision needed

5. **Next Month Plan & Action Items** (5 min)
   - Priorities and deliverables
   - Client action items with deadlines

### Supporting Materials
- Monthly performance report (attached/linked)
- [Any additional relevant documents]
```

### Quarterly Business Review (90 min)
```markdown
# [Client Name] — Q[X] Business Review
## [Date] | [Time] | 90 min

### Agenda

1. **Quarterly Performance Summary** (15 min)
2. **Goal Progress & Forecasting** (15 min)
3. **Channel Performance Deep Dive** (20 min)
4. **Competitive Landscape** (10 min)
5. **Strategic Recommendations for Next Quarter** (20 min)
6. **Budget & Investment Discussion** (10 min)
7. **Q&A and Open Discussion** (10 min)

### Pre-Meeting Preparation
- [ ] Quarterly report finalized and sent 48 hours in advance
- [ ] Competitive analysis updated
- [ ] Next quarter strategy document drafted
- [ ] Budget recommendations prepared with data support
```

## Phase 4: Talking Points

For each agenda item, prepare:
- **Key message** — The one thing the client should take away
- **Supporting data** — Numbers that back up the message
- **Potential pushback** — What the client might question
- **Response to pushback** — Data-backed answer
- **Transition** — How to move to the next topic smoothly

## Phase 5: Post-Meeting Template

Prepare the follow-up email template:

```
Subject: Recap — [Client Name] [Meeting Type] [Date]

Hi [Name],

Great [call/meeting] today. Here's a recap:

**Key Decisions:**
- [Decision 1]
- [Decision 2]

**Action Items:**
| Item | Owner | Due Date |
|------|-------|----------|
| [Task] | [Name/Team] | [Date] |

**Next Meeting:** [Date/Time]

Let me know if I missed anything.

Best,
[Name]
```

## Phase 6: Memory Update

1. Store the agenda and key topics in working memory
2. After the meeting, update working memory with decisions and action items
3. Store any new client preferences or stakeholder insights in structured memory
4. Note follow-up deadlines for proactive management
