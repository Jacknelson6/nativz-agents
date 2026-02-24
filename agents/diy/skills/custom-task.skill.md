---
name: custom-task
description: General-purpose task execution framework for any user-defined task
triggers: [help, task, do, build, create, analyze, research, find, make, write, generate, automate]
tools_required: [web-crawl, screenshot, http-request, file-write, file-read, web-search]
---

# Custom Task Execution

This is the general-purpose skill for the DIY Agent. It activates for any task that doesn't match a more specific skill. Follow this adaptive workflow.

## Phase 1: Task Understanding

### Parse the Request
1. **What** — What is the user asking for? (Output type: document, analysis, code, data, answer)
2. **Why** — What's the goal behind the request? (Context helps quality)
3. **How detailed** — Does the user want a quick answer or a comprehensive deliverable?
4. **Format** — What output format is expected? (File, conversation response, structured data)

### Check Memory
- Read working memory for any prior context on this task or related work
- Check structured memory for user preferences (output format, communication style, domain context)
- Reference any previously stored project information

### Clarify if Needed
If the request is ambiguous, ask ONE focused clarifying question. Don't ask five questions — pick the most important unknown and make reasonable assumptions for the rest.

## Phase 2: Tool Selection

Match the task to the best tools:

| Task Type | Primary Tools | When to Use |
|-----------|--------------|-------------|
| Research | web-search, web-crawl | Finding information, competitive analysis, market research |
| Data extraction | web-crawl, stagehand-extract, http-request | Pulling structured data from websites or APIs |
| Content creation | file-write | Writing documents, reports, scripts, plans |
| Analysis | file-read, http-request | Processing existing data, files, or API responses |
| Visual capture | screenshot | Documenting UI states, capturing web pages, visual comparison |
| API interaction | http-request | Testing endpoints, fetching JSON, webhook testing |
| File management | file-read, file-write | Reading, creating, updating files and documents |

## Phase 3: Execution

### For Research Tasks
1. Start with broad web-search to map the landscape
2. Identify 3-5 authoritative sources
3. Deep-dive key sources with web-crawl for detail
4. Synthesize findings into structured output
5. Include citations and source links
6. Note confidence level and gaps

### For Creation Tasks
1. Outline the deliverable structure
2. Create the content/code/document
3. Self-review against requirements
4. Save to file if substantial
5. Present with summary and usage instructions

### For Analysis Tasks
1. Gather all relevant data
2. Apply appropriate analytical framework
3. Identify patterns, outliers, and insights
4. Present findings with supporting evidence
5. Provide actionable recommendations

### For Automation Tasks
1. Understand the workflow to automate
2. Break into discrete steps
3. Identify which tools handle each step
4. Execute the workflow
5. Document the process for repeatability

## Phase 4: Quality Check

Before delivering:
- [ ] Does the output directly address the user's request?
- [ ] Is the format appropriate and easy to consume?
- [ ] Have I used tools where they add value (not just described what I could do)?
- [ ] Is the response proportional to the question's complexity?
- [ ] Are sources cited where applicable?
- [ ] Have I stored useful findings in working memory?
- [ ] Are there natural next steps I should suggest?

## Phase 5: Follow-Up

After delivering:
1. Store key findings or outputs in working memory for future reference
2. Store any user preferences discovered during the task in structured memory
3. Suggest 1-2 natural follow-up actions
4. If the task is part of a larger project, note the progress and remaining steps
