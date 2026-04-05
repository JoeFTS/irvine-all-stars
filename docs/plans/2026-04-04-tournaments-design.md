# Tournament Feature — Design Spec

**Date:** 2026-04-04
**Status:** Approved

## Overview

Add a tournament management system so coaches and parents can see upcoming tournaments relevant to their divisions, view flyers, and register via external links (tourneymachine.com). Admin manages tournaments through the admin panel. Tournaments also auto-post to the announcements feed.

**Future scope (not this build):** Nightly Firecrawl cron job on Mac Mini to auto-discover local PONY tournaments and suggest them for publishing.

---

## Data Model

New `tournaments` table in Supabase (`irvine_allstars` schema):

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `name` | text | e.g., "South Bay Sunset Classic" |
| `start_date` | date | Tournament start |
| `end_date` | date | Tournament end |
| `location` | text | e.g., "Manhattan Beach & Redondo Beach, CA" |
| `divisions_display` | text | Freeform text as organizer wrote it: "Shetland 6, Pinto 8 PP, Mustang 9, Mustang 10, Bronco 11, Bronco 12" |
| `division_ids` | text[] | Array of site division IDs for filtering: `["5U-6U-Shetland", "9U-10U-Mustang"]` |
| `registration_url` | text | tourneymachine.com link (nullable — null = "Coming Soon") |
| `registration_deadline` | date | Nullable |
| `host` | text | e.g., "South Bay PONY / Redondo Sunset" |
| `description` | text | Free text for extra details |
| `flyer_url` | text | Path to uploaded flyer image in Supabase Storage (nullable) |
| `status` | text | "draft" or "published" |
| `auto_announce` | boolean | Default true — creates announcement on publish |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

## Admin Panel (`/admin/tournaments`)

### List View
- Table of all tournaments (drafts + published), sorted by start date
- Columns: Name, Dates, Divisions, Status, Actions (Edit / Delete)
- Status badge: gray "Draft" or green "Published"
- "Add Tournament" button at top

### Add/Edit Form
- **Name** — text input
- **Start Date / End Date** — date inputs
- **Location** — text input
- **Divisions Display** — text input for freeform text ("Shetland 6, Pinto 8 PP...")
- **Division IDs** — multi-select checkboxes of the 12 site divisions (for filtering)
- **Registration URL** — text input (optional)
- **Registration Deadline** — date input (optional)
- **Host** — text input
- **Description** — textarea
- **Flyer Image** — file upload → Supabase Storage, displayed on tournament cards
- **Status** — dropdown: Draft / Published
- **Auto-announce** — checkbox (checked by default)

### Publish Behavior
- Changing status Draft → Published with auto-announce checked:
  - Creates one `announcements` record with null division (general — visible to all)
  - Title: "Tournament: {name} — {date range}"
  - Body: Location, divisions, host, registration link
- Re-publishing (editing an already-published tournament) does NOT create a duplicate announcement

---

## Coach & Parent Portals — Tournaments Tab

### Navigation
- New "Tournaments" nav item with trophy icon
- Coach: `/coach/tournaments`
- Parent: `/portal/tournaments`

### Page Layout (Card Grid)
- Hero: "TOURNAMENTS" in Dela Gothic One, subtitle "Upcoming tournaments for your division"
- Responsive 2-column card grid (1 column on mobile)
- Grouped by month headers ("JUNE 2026") with baseball stitch dividers

### Tournament Card
- **Top:** Clickable flyer image → opens lightbox modal (full-size view). Falls back to styled gradient placeholder with tournament name if no flyer.
- **Body:** Tournament name, date range (calendar icon), location (map pin icon), host name
- **Division pills:** Small cream badges showing freeform `divisions_display` text
- **Status badge:** Green "Registration Open" or amber "Coming Soon"
- **Bottom:** Red pill "Register" button → opens `registration_url` in new tab. Disabled/gray if no URL.

### Division Filtering
- **Coach portal:** Only shows tournaments where `division_ids` includes the coach's assigned division
- **Parent portal:** Only shows tournaments where `division_ids` overlaps with any of the parent's players' divisions
- **Empty state:** "No upcoming tournaments for your division yet"

### Lightbox Modal
- Overlay with full-size flyer image
- Click outside or X button to close

---

## Announcement Feed Integration

### Auto-Announcement on Publish
When a tournament is published with `auto_announce = true`:
- Creates one announcement with `division = null` (general, visible to everyone)
- Tagged with "Tournament" category (gold badge color)
- Includes tournament name, dates, location, divisions, and registration link in body

### Where It Appears
- **Coach Updates tab** (`/coach/updates`): Shows in existing announcements feed with "Tournament" gold badge
- **Parent Portal announcements section**: Shows in filtered feed with "Tournament" badge and clickable registration link

---

## Reference: Initial Tournament Data

### South Bay Sunset Classic
- **Dates:** June 6-7, 2026
- **Location:** Manhattan Beach & Redondo Beach, CA
- **Divisions Display:** "Shetland 6, Pinto 8 PP, Mustang 9, Mustang 10, Bronco 11, Bronco 12"
- **Division IDs:** `["5U-6U-Shetland", "7U-8U-Pinto-PP", "9U-10U-Mustang", "11U-12U-Bronco"]`
- **Registration URL:** https://tourneymachine.com/R178982
- **Host:** South Bay PONY / Redondo Sunset

### South Bay MP Classic
- **Dates:** June 13-14, 2026
- **Location:** Manhattan Beach, CA
- **Divisions Display:** "Pinto 7 Machine Pitch, Pinto 8 Machine Pitch"
- **Division IDs:** `["7U-8U-Pinto-MP"]`
- **Registration URL:** https://tourneymachine.com/R179145
- **Host:** South Bay PONY
