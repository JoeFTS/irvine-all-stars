# Volunteer Acknowledgment & Coach's Corner — Design

**Date:** 2026-04-10
**Status:** Approved, ready for implementation
**Scope:** Two independent features shipped together in a single design cycle.

---

## Feature 1 — Parent Volunteer Acknowledgment

### Goal

Parents must explicitly acknowledge the volunteer requirement before they can commit to a roster spot or tryout slot. Creates a documented paper trail and sets expectations before the season begins.

### Exact acknowledgment copy

> "All-Star Parents will need to volunteer to help with MDT or any PONY events Irvine PONY hosts."

### Database change

New migration `supabase/migrations/20260410_add_volunteer_acknowledgment.sql`:

```sql
ALTER TABLE irvine_allstars.tryout_registrations
  ADD COLUMN volunteer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN volunteer_acknowledged_at TIMESTAMPTZ;
```

No separate table, no season column. For 2026 (our first season running this), "acknowledged" = any of this parent's current registrations has `volunteer_acknowledged = true`. When 2027 comes around we'll revisit with a proper season model.

### Parent portal behavior

On `src/app/portal/page.tsx`:

- Compute `isAcknowledged = registrations.some(r => r.volunteer_acknowledged)` after registrations load.
- If `!isAcknowledged`, render a prominent amber/red **Volunteer Requirement** banner at the top of the "My Player's Status" section, above the registration cards. Banner contains the acknowledgment copy, a required checkbox, and an "I Acknowledge" button (disabled until the box is checked).
- On click, POST to `/api/acknowledge-volunteer` which updates **all** of the current parent's registrations in one shot (`volunteer_acknowledged = true`, `volunteer_acknowledged_at = now()`). One ack covers siblings.
- If `isAcknowledged`, render a compact muted-green confirmation strip instead: `✓ Volunteer requirement acknowledged on Apr 9, 2026`.

### Semi-hard gate

Two action buttons are disabled when `!isAcknowledged`, with an explanatory tooltip:

- **Accept Selection** button on the registration cards
- **Confirm Attendance** button inside the tryout time card

Tooltip copy: *"Please acknowledge the volunteer requirement at the top of this page first."*

All other portal features (documents, medical release, tournament viewing) remain accessible. The gate applies only at the two "committing to the season" moments where the volunteer agreement is load-bearing.

### Admin view

On `src/app/admin/tryouts/page.tsx`, add a new **Volunteer Ack** column to the registrations table:

- ✓ green checkmark + date tooltip — acknowledged
- ✗ red X — not yet
- — gray dash — registration incomplete

Plus a filter chip at the top: "Show only: unacknowledged" so the coordinator can quickly audit who hasn't completed it.

### API route

New file `src/app/api/acknowledge-volunteer/route.ts` — POST handler that authenticates via the anon key (RLS policies already allow parents to update their own registrations by email match), updates all rows where `parent_email = auth.email()`, returns updated count.

---

## Feature 2 — Coach's Corner

### Goal

Give coaches a single organized home for non-compliance resources (tournaments, templates, fundraising) without cluttering the dashboard with hidden-until-needed content.

### Dashboard layout change

On `src/app/coach/page.tsx`:

1. **Shrink existing Quick Links** from the current card grid into a compact 4-column icon strip at the very top of the dashboard (just above "Your Team"), roughly 48px tall. Icon + one-word label each. Keeps critical workflow entries one tap away without eating vertical space.
2. **Coach's Corner section** takes the dashboard real estate where Quick Links used to live, at the bottom.

### Coach's Corner card grid

2×2 grid on desktop, stacking to 1 column on mobile:

```
┌─────────────────┬─────────────────┐
│  🏆 Tournaments │  📋 Templates    │
│  MDT, rules,    │  Snack schedule │
│  hotel blocks   │  + more         │
│                →│                →│
├─────────────────┼─────────────────┤
│  💰 Fundraising │  ✨ Coming Soon  │
│  6 proven ideas │  More resources │
│  + playbooks    │  dropping soon  │
│                →│    (muted)      │
└─────────────────┴─────────────────┘
```

Three live cards link to subpages; Coming Soon is visually muted (`bg-gray-50`, `text-gray-400`, no chevron, `cursor: default`, not a link).

**Styling** matches existing dashboard cards: `bg-white border border-gray-200 rounded-2xl p-5 sm:p-6`, colored icon tile (`bg-flag-blue/10 text-flag-blue p-3 rounded-lg`, or `bg-flag-red/10 text-flag-red` for Fundraising), `font-display text-lg font-bold uppercase tracking-wide` for the category label, `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`.

### Routes

```
/coach                         ← dashboard with Coach's Corner section
/coach/corner/tournaments      ← subpage 1
/coach/corner/templates        ← subpage 2
/coach/corner/fundraising      ← subpage 3
```

Shared layout wrapper `src/app/coach/corner/layout.tsx` provides breadcrumb navigation back to `/coach`.

---

### Subpage: `/coach/corner/tournaments`

**Sections top to bottom:**

1. **Your Division Rules** (personalized, prominent)
   - Reads `profile.division`, maps via `src/content/divisions.ts` to rule family + page range in the master PONY rulebook
   - Shows: *"Your Division: 11U Bronco — Bronco rules begin on page 22"*
   - Primary CTA: `[ Download 2026 PONY Rulebook (PDF) ↓ ]`
   - Secondary: "View all division rules" expands an inline accordion listing all 12 Irvine divisions with their page ranges, all linking to the same PDF

2. **Upcoming Tournaments** — existing `tournaments` table filtered by coach's division (name, date, location, deadline, flyer thumbnail). Links to existing `/coach/tournaments` detail view.

3. **Tournament Rules & Forms** — downloadable resources list:
   - 2026 PONY Rulebook
   - MDT entry form (when uploaded)
   - Sanction tournament schedule link (Google Sheet already referenced on the dashboard)
   - Hotel block info ("Coming soon" state if empty)

4. **Pre-Tournament Checklist** — static informational card linking back to the relevant compliance items.

### Division-to-rulebook mapping

Single master PDF: [`2026 PONY Baseball Rule Book`](https://cdn3.sportngin.com/attachments/document/0095/4659/2026_PONY_Baseball_Rule_Book_Final_Proof.pdf)

Downloaded once and committed to `public/rules/2026-pony-baseball-rulebook.pdf` so we control availability.

All 12 Irvine divisions map to 5 rule families in the master rulebook:

| Irvine Division | Rule Family | Page Range |
|---|---|---|
| 5U Shetland, 6U Shetland | Shetland | TBD during implementation |
| 7U Pinto Machine Pitch, 8U Pinto Machine Pitch | Pinto (Machine Pitch) | TBD |
| 7U Pinto Kid Pitch, 8U Pinto Kid Pitch | Pinto (Kid Pitch) | TBD |
| 9U Mustang, 10U Mustang | Mustang | TBD |
| 11U Bronco, 12U Bronco | Bronco | TBD |
| 13U Pony, 14U Pony | Pony | TBD |

Exact page numbers will be extracted from the TOC once the PDF is downloaded.

`src/content/divisions.ts` gains two fields per division: `rulebookSection: string` (e.g., "Bronco") and `rulebookPageStart: number`.

---

### Subpage: `/coach/corner/templates`

Sparse at launch, deliberately:

1. **Snack Schedule Template** — Excel file with preview thumbnail, download button, instructions subtext ("Open in Excel or Google Sheets, add family names, share with your team.")
2. **Coming Soon placeholder card** — muted, lists planned templates (roster template, practice plan template, parent contact sheet)

---

### Subpage: `/coach/corner/fundraising`

**Header:** "Fundraising — Six proven ways to raise money for your team's season."

**Structure:** Vertical stack of 6 fully-expanded idea cards (not accordion — comparison is the value). Each card contains:

- Icon (unique per fundraiser) + idea name
- Typical yield ($ range) + effort badge (Low/Medium/High, color-coded)
- 1-paragraph description
- 5-bullet quick steps
- `[ Download Full Playbook (PDF) ↓ ]` button

Top of page: small summary card encouraging coaches to pick 1–2 that fit their team.
Bottom of page: disclaimer about coordinator approval / Irvine PONY fundraising policies.

### The six fundraising ideas

1. **Hit-a-Thon** — Per-hit pledges, single-day event. Flagship option. Yield $500–$2,000. Effort: Low.
2. **Home Run Derby Night** — Spectator admission + per-HR pledges + concessions + sponsor-a-hitter slots. Yield $1,500–$5,000. Effort: Medium.
3. **Sponsor-a-Banner (Tiered)** — Local business outfield/dugout banners in tiered packages (Bronze $150, Silver $350, Gold $750). Highest-margin option. Yield $1,000–$5,000. Effort: Medium.
4. **Online Crowdfunding Blast** — Snap! Raise-style automated campaign via platform (or DIY GoFundMe fallback). Each player contributes 15–20 contact emails; platform handles outreach. Yield $5,000–$25,000. Effort: Low.
5. **Team Raffle with Donated Prizes** — Raffle tickets sold before/during games; prizes donated by local businesses. Pure-margin play. Yield $500–$3,000. Effort: Low–Medium.
6. **Pie-the-Coach / Dunk Tank** — Event add-on at a scrimmage or team BBQ. $5/pie, $10/dunk. Yield $200–$800. Effort: Low.

### Playbook PDFs

Six one-pager branded PDFs, committed to `public/fundraising/<slug>-playbook.pdf`, pre-generated (not on-demand).

**Layout, letter-size one-pager:**

- **Header:** Irvine All-Stars wordmark (flag-blue), "FUNDRAISING PLAYBOOK" label (flag-red uppercase, tracking-wide), fundraiser name in `font-display`
- **Body (two columns):**
  - **Left (65%):** "What it is," numbered 8–12 step-by-step, "Tips from experience"
  - **Right (35%):** "At a Glance" stat box (yield / effort / timeline / people), "What you need" checklist, small themed illustration from `/imagegen`
- **Footer:** Irvine PONY star-strip pattern, `irvinepony.com/coach` URL, disclaimer about coordinator approval

**Generation:** Find existing PDF pipeline (probably the `pdf-converter` skill / fpdf2 pipeline that built `docs/Coach-Portal-Guide.pdf`). Write a `scripts/generate-fundraising-playbooks.ts` that produces all 6 from templated HTML. Run once, commit the outputs, regenerate only when content changes.

Playbook prose (8–12 steps per fundraiser) will be drafted in markdown first and reviewed before PDFs are generated.

---

## Implementation Sequence

Four commit-sized chunks, each deployable independently:

1. **Volunteer acknowledgment** — migration, parent banner, semi-hard gate, admin column. Smallest, highest compliance value. Ship first.
2. **Coach's Corner scaffolding** — dashboard Quick Links shrink, Coach's Corner card grid, empty subpage shells with headers + breadcrumbs, Templates subpage (snack schedule + coming soon).
3. **Tournaments subpage + division rules** — download PONY rulebook, build division→page mapping, wire personalized card, upcoming tournaments list, rules & forms section, pre-tournament checklist.
4. **Fundraising subpage + playbook PDFs** — fundraising ideas data file, on-page summary cards, draft playbook content, generate 6 branded PDFs, commit statics.

## File Change Map

**New files:**
- `supabase/migrations/20260410_add_volunteer_acknowledgment.sql`
- `src/app/api/acknowledge-volunteer/route.ts`
- `src/app/coach/corner/layout.tsx`
- `src/app/coach/corner/tournaments/page.tsx`
- `src/app/coach/corner/templates/page.tsx`
- `src/app/coach/corner/fundraising/page.tsx`
- `src/content/fundraising-ideas.ts`
- `public/rules/2026-pony-baseball-rulebook.pdf`
- `public/fundraising/{hit-a-thon,home-run-derby,sponsor-a-banner,crowdfunding,team-raffle,pie-the-coach}-playbook.pdf`
- `scripts/generate-fundraising-playbooks.ts`

**Modified files:**
- `src/app/portal/page.tsx`
- `src/app/coach/page.tsx`
- `src/app/admin/tryouts/page.tsx`
- `src/content/divisions.ts`

## Open Items Resolved During Implementation

1. **Playbook content** — drafted inline before PDF generation, reviewed before becoming static files.
2. **Rulebook page numbers** — extracted from TOC after downloading the PDF.
3. **PDF generation pipeline** — to be located; reuses whatever built the existing portal guide PDFs.
