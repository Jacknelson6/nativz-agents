---
name: Campaign Setup & Launch
description: End-to-end paid media campaign setup across Meta Ads, Google Ads, and TikTok Ads — from strategy through launch with proper tracking, targeting, creative, and budget configuration.
triggers:
  - "set up a campaign"
  - "launch ads"
  - "create a campaign"
  - "campaign setup"
  - "build a campaign"
  - "new ad campaign"
tools_required:
  - http-request
  - file-write
  - web-search
  - screenshot
  - stagehand-extract
---

# Campaign Setup & Launch Workflow

## Step 1: Strategy & Goal Definition
- Check working memory for existing client context (business model, past performance, ROAS targets)
- Confirm: objective (awareness/traffic/conversions/leads), platform(s), budget, timeline, KPIs
- Define target CPA or ROAS based on unit economics (LTV, AOV, margins)
- Determine funnel stage: prospecting, retargeting, or retention

## Step 2: Audience Strategy
**Meta Ads:**
- Define core audience signals (interests, behaviors, demographics) or go broad with Advantage+
- Build custom audiences: website visitors (30/60/90/180 day), purchasers, email lists, engagement audiences
- Create lookalike audiences from best-performing custom audiences (1%, 3%, 5%)
- Set exclusions: existing customers (unless retention), recent converters, irrelevant demographics

**Google Ads:**
- Build keyword lists by match type (broad + smart bidding for reach, exact for brand protection)
- Define negative keyword lists from historical data or industry knowledge
- Set audience signals for PMax: customer lists, website visitors, custom intent segments
- Configure geo-targeting, ad schedule, device adjustments

**TikTok Ads:**
- Define targeting: demographics, interests, behaviors, or broad with Smart Performance Campaign
- Upload custom audiences if available (pixel audiences, customer lists)
- Select optimization event: click, view content, add to cart, purchase, lead submission

## Step 3: Creative Planning
- Review available creative assets (video, static, UGC, product photography)
- Plan 3-5 creative variations per ad set/group minimum
- Ensure creative matches platform norms (native TikTok ≠ polished Instagram ≠ informational Google)
- Write ad copy variations: test multiple hooks, CTAs, and value propositions
- Create creative brief if assets need to be produced

## Step 4: Tracking & Attribution Setup
- Verify pixel/tag installation on all conversion pages
- Confirm Conversion API (CAPI) setup for Meta (check Event Match Quality)
- Set up conversion actions in Google Ads (import from GA4 or tag-based)
- Configure TikTok pixel events and test with Pixel Helper
- Define attribution window and model
- Set up UTM parameters for cross-platform tracking in GA4

## Step 5: Campaign Build
- Create campaign structure following platform best practices
- Configure budget (daily vs lifetime), bid strategy, and optimization goal
- Upload creative assets, write ad copy, set CTAs
- Configure placements (automatic vs manual — usually automatic for Meta/TikTok, managed for Google)
- Set scheduling: start/end dates, dayparting if applicable
- Double-check all settings before launch

## Step 6: Pre-Launch QA Checklist
- [ ] Landing page loads fast (<3s) and matches ad messaging
- [ ] Tracking fires correctly on all conversion events (test with browser dev tools)
- [ ] Ad preview looks correct on mobile and desktop
- [ ] Budget and bid settings match the plan
- [ ] Audience targeting is correctly configured (check exclusions)
- [ ] No spelling errors in ad copy
- [ ] UTM parameters are appended to all destination URLs
- [ ] Payment method is active on the ad account

## Step 7: Launch & Monitoring Plan
- Launch campaign and monitor first 24-48 hours closely
- Check delivery, spend pacing, CPM, CTR, and conversion tracking
- Document launch details in working memory for future reference
- Set review schedule: daily for first week, then weekly optimization
- Plan first optimization review at 50 conversions (Meta learning phase exit)
