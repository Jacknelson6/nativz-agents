---
name: Content Calendar Planning
description: Build comprehensive multi-platform content calendars with themes, posting schedules, content types, and strategic alignment to business goals.
triggers:
  - "content calendar"
  - "posting schedule"
  - "plan content"
  - "monthly content plan"
  - "what should we post"
  - "content strategy"
tools_required:
  - file-write
  - web-search
---

# Content Calendar Workflow

## Step 1: Strategic Foundation
- Check working memory for client's content pillars, posting frequency, and past calendar data
- Confirm: platforms, posting frequency per platform, content pillars/themes, upcoming events or launches, brand guidelines
- Review past performance data if available: what content types and topics performed best?
- Identify key dates: holidays, industry events, product launches, seasonal trends

## Step 2: Content Pillar Mapping
Define 3-5 content pillars that align with business goals:
- **Educational:** Tips, how-tos, industry insights (builds authority)
- **Entertaining:** Trends, humor, relatable content (builds reach)
- **Promotional:** Product features, offers, testimonials (drives conversions)
- **Community:** UGC, polls, questions, behind-the-scenes (builds engagement)
- **Brand Story:** Values, team, mission, culture (builds connection)

Assign percentage allocation: e.g., 40% educational, 25% entertaining, 15% promotional, 10% community, 10% brand story

## Step 3: Calendar Construction
For each week:
1. Assign content pillar per day based on the allocation mix
2. Define content format: Reel, carousel, static image, Story, TikTok, YouTube Short, long-form video
3. Write content concept: brief description of the idea, hook angle, key message
4. Note platform(s): which platforms this content will be published/repurposed to
5. Assign status: Idea → Scripted → Filmed → Edited → Scheduled → Published
6. Note any assets needed: footage, graphics, music, talent

## Step 4: Calendar Format
Output as a structured table:

```markdown
| Date | Day | Platform(s) | Pillar | Format | Concept | Hook | CTA | Status |
|------|-----|-------------|--------|--------|---------|------|-----|--------|
| 3/3  | Mon | IG, TT      | Edu    | Reel   | 3 mistakes in... | "Stop doing this..." | Save + Share | Idea |
```

## Step 5: Trend Integration
- Research current and upcoming trends relevant to the client's niche
- Reserve 1-2 slots per week as "flex" for reactive trend content
- Note trending sounds, formats, and hashtags in working memory for the team

## Step 6: Review & Refinement
- [ ] Content mix follows the pillar allocation (not all promotional, not all educational)
- [ ] Posting frequency matches agreed cadence per platform
- [ ] Key dates and events are covered
- [ ] Variety in content formats (not all the same type)
- [ ] Each post has a clear objective and CTA
- [ ] Calendar is realistic given available resources (talent, editor capacity)
- Save final calendar using `file-write` and store key themes in working memory
