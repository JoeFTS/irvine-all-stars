# Tournament Discovery Cron Job — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Overview

Standalone Node.js script that runs nightly at 2am on the Mac Mini (100.100.46.56) via PM2 cron. Uses self-hosted Firecrawl (localhost:3002) to discover upcoming Southern California youth baseball tournaments, scrapes details + flyer images, and inserts them as drafts into the Supabase database for admin review.

## Architecture

**Runtime flow:**
1. **Search** — Parallel Firecrawl `/search` calls for Google queries + direct `/scrape` on aggregator URLs
2. **Parse** — Extract tournament candidates from markdown: name, dates, location, divisions, registration URL, flyer image URL
3. **Filter** — Keep tournaments relevant to ages 4–14 / divisions 5U–14U, within Southern California
4. **Deduplicate** — Query `irvine_allstars.tournaments`, fuzzy match on name + start_date (±3 days)
5. **Images** — Download flyer images, upload to `tournament-flyers` Supabase Storage bucket
6. **Insert** — Insert as `status: 'draft'` + create linked draft announcement
7. **Notify** — Send admin summary email via Resend if new tournaments found

**Dependencies:** `@supabase/supabase-js`, `resend` (both already in project). Everything else is Node built-in `fetch`.

## Search Strategy

### Google Searches (Firecrawl `/search`)
```
"Southern California youth baseball tournament 2026"
"PONY baseball tournament California"
"USSSA baseball tournament Orange County"
"Triple Crown baseball tournament SoCal"
"Nations Baseball tournament California"
"TourneyMachine baseball California"
"South Bay Pony tournament"
"All Star baseball tournament Southern California"
"All Stars baseball tournament Orange County"
```

### Aggregator Direct Scrapes
- tourneymachine.com — California baseball listing pages
- usssa.com — SoCal baseball event finder
- triplecrownsports.com — California events
- nationsbaseball.com — tournament calendar

For aggregators: scrape listing page → extract individual tournament links → scrape each detail page.

**Rate limiting:** Sequential scrapes with 2-second delay. Estimated runtime: 5–10 minutes for ~50–80 pages.

### Extraction from Markdown
- Tournament name: page title or H1
- Dates: regex for patterns like "June 6-7, 2026"
- Location/field name
- Age/division keywords (match against 5U–14U)
- Registration URLs (links containing "register", "signup", tourneymachine)
- Image URLs (flyer images, .jpg/.png)

## Filtering

### Geographic Filter
Configurable city/region list. Keep tournaments mentioning: Orange County, Los Angeles, Inland Empire, San Diego, Ventura, Riverside, San Bernardino, or specific cities (Irvine, Anaheim, Huntington Beach, Long Beach, etc.). Discard NorCal, Arizona, Nevada.

### Age/Division Filter
Match content against:
```
5U, 6U, 7U, 8U, 9U, 10U, 11U, 12U, 13U, 14U,
Shetland, Pinto, Mustang, Bronco, Pony,
"ages 4-14", "youth baseball"
```

Division mapping:
- Shetland → 5u, 6u
- Pinto → 7u-mp, 7u-kp, 8u-mp, 8u-kp
- Mustang → 9u, 10u
- Bronco → 11u, 12u
- Pony → 13u, 14u

Store both `divisions_display` (raw text) and `division_ids` (mapped array).

## Deduplication

Query existing tournaments, match on:
- Normalized name similarity > 80% (lowercase, strip common words)
- Date overlap within ±3 days

If both match → skip as duplicate. Updated info on known tournaments is logged but not auto-updated (admin handles manually).

## Image Handling

1. Download flyer image via `fetch()`
2. Upload to Supabase Storage `tournament-flyers` bucket as `{tournament-id}.{ext}`
3. Set `flyer_url` on tournament record

## Insert

- Tournament: `irvine_allstars.tournaments` with `status: 'draft'`
- Announcement: `irvine_allstars.announcements` linked to tournament, also draft/unpublished

## Admin Notification

After all inserts, if new tournaments found:
- **Via:** Resend (already a project dependency)
- **To:** `ADMIN_EMAIL` env var
- **Subject:** "{count} New Tournament(s) Discovered — Review Needed"
- **Body:** List of names, dates, locations + link to `/admin/tournaments`
- No email if zero found or on script errors

## PM2 Setup

```bash
pm2 start scripts/tournament-discovery/discover.mjs \
  --name tournament-discovery \
  --cron "0 2 * * *" \
  --no-autorestart
```

Logging via PM2: `~/.pm2/logs/tournament-discovery-out.log`
Each run starts with timestamp header, ends with summary stats.

## Environment Variables (Mac Mini)

- `SUPABASE_URL` — project API URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (backend script needs insert perms)
- `FIRECRAWL_URL` — defaults to `http://localhost:3002`
- `RESEND_API_KEY`
- `ADMIN_EMAIL`

## File Structure

```
scripts/tournament-discovery/
├── discover.mjs          # Main entry — orchestrates pipeline
├── config.mjs            # Queries, URLs, division maps, city list
├── search.mjs            # Firecrawl /search and /scrape wrappers
├── parse.mjs             # Extract tournament data from markdown
├── filter.mjs            # Geographic + age/division filtering
├── dedupe.mjs            # Query DB, fuzzy match
├── images.mjs            # Download + upload flyer images
├── insert.mjs            # Insert tournaments + announcements
├── notify.mjs            # Admin email via Resend
└── ecosystem.config.cjs  # PM2 config
```

## Updating

`git pull` on Mac Mini → PM2 picks up new code on next cron run. `pm2 restart tournament-discovery` if immediate update needed.
