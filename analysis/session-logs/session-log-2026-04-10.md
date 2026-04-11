# Session Log: 2026-04-10

## Objective
Ship two new features to the Irvine All-Stars site: (1) a parent volunteer acknowledgment gate on the parent portal with admin visibility, and (2) a "Coach's Corner" section on the coach dashboard with Tournaments, Templates, and Fundraising subpages, plus a premium brand makeover of the visual treatment.

## What Was Done

All work is live on `main` and deployed to the VPS. Five commits in total.

### Commit 1 — Design Document (`3b13c5f`)

`docs/plans/2026-04-10-volunteer-ack-and-coaches-corner-design.md`

Documented both features end-to-end: scope, database changes, UI behavior, semi-hard gating model, Coach's Corner dashboard layout, four-card grid structure, subpage content for each category, fundraising idea list, branded playbook PDF approach, division rulebook strategy, file change map, and build sequence.

### Commit 2 — Parent Volunteer Acknowledgment (`ce84d69`)

**Migration (applied via Supabase Management API):**
```sql
ALTER TABLE irvine_allstars.tryout_registrations
  ADD COLUMN volunteer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN volunteer_acknowledged_at TIMESTAMPTZ;
```

- `supabase/migrations/20260410_add_volunteer_acknowledgment.sql` — migration file committed
- Verified columns exist via information_schema query after applying

**Parent portal (`src/app/portal/page.tsx`):**
- Added amber/red banner at the top of the "My Player's Status" section with the exact copy: *"All-Star Parents will need to volunteer to help with MDT or any PONY events Irvine PONY hosts."*
- Required checkbox + "I Acknowledge" button (disabled until checked)
- When clicked, updates `volunteer_acknowledged` + `volunteer_acknowledged_at` on **all** of the parent's current registrations in one shot so one acknowledgment covers siblings
- Once acknowledged, banner collapses to a compact green confirmation strip showing the ack date
- **Semi-hard gate:** "Accept Spot" and "Confirm Attendance" buttons are disabled with a tooltip (*"Please acknowledge the volunteer requirement at the top of this page first."*) until acknowledgment exists
- All other portal features (documents, medical release, tournament viewing) remain accessible
- Client-side update via authenticated supabase client — no new API route needed because the existing RLS policy `Parents can update own registrations` already enforces email matching

**Admin (`src/app/admin/tryouts/page.tsx`):**
- New "Volunteer Ack" chip on every player row: green "Volunteer Ack" with date tooltip when acknowledged, flag-red "Volunteer Ack Missing" when not
- New "Volunteer Ack Missing" filter chip at the top of the filters bar with a live count (respects division filter)
- Registration interface extended with `volunteer_acknowledged` and `volunteer_acknowledged_at` fields

### Commit 3 — Coach's Corner Scaffolding (`1ff4c1c`)

**Dashboard (`src/app/coach/page.tsx`):**
- Existing Quick Links section at the bottom (Binder Checklist, Pitching Log, Roster, etc.) replaced by the new Coach's Corner section
- Quick Links moved to a compact 4-column icon strip at the top of the dashboard (just above "Your Team") so workflow entries stay one tap away
- Added Coach's Corner 2×2 card grid with four tiles: Tournaments, Templates, Fundraising, Coming Soon

**New routes:**
- `src/app/coach/corner/layout.tsx` — shared breadcrumb navigation
- `src/app/coach/corner/tournaments/page.tsx` — placeholder shell
- `src/app/coach/corner/templates/page.tsx` — snack schedule download + coming-soon card
- `src/app/coach/corner/fundraising/page.tsx` — placeholder shell

**Snack schedule template:**
- `scripts/generate-snack-schedule-template.mjs` — Node/exceljs generator with Irvine All-Stars branding (flag-blue title bar, flag-red header row, zebra striping, frozen header row, how-to-use footer, fitted to one printable page)
- `public/templates/snack-schedule.xlsx` — generated output committed

### Commit 4 — Tournaments Subpage + Division Rules (`95db269`)

**Rulebook PDF:**
- Downloaded the 2026 PONY Baseball Rulebook from `cdn3.sportngin.com/attachments/document/f8cc-2645833/2026_PONY_Baseball_Rule_Book_Final_Proof__1_.pdf` (a different URL than the Google-indexed one, which returned Access Denied)
- Committed to `public/rules/2026-pony-baseball-rulebook.pdf` so we control availability
- The PDF is a single master rulebook — division specifics are called out inline within each rule topic (Playing Rules, Pitching Rules, Length of Games, Schedule), not in separate per-division chapters

**Divisions data (`src/content/divisions.ts`):**
- Added `ruleFamily: RuleFamilyKey` field to every division (6 families: shetland, pinto_mp, pinto_kp, mustang, bronco, pony)
- New `ruleFamilies` lookup table with per-family quick-reference rules extracted from the PDF: diamond size, pitching distance, game innings, mercy rule, pitch type, lead-off rules, daily pitch counts, and 5 key rules at a glance
- New `matchRuleFamily()` loose-matcher that handles inconsistent profile division string formats (e.g., "12U-Bronco", "12U Bronco", "Bronco 12U")

**Tournaments subpage (`src/app/coach/corner/tournaments/page.tsx`):**
- Personalized "Your Division Rules" card: reads `profile.division`, maps to rule family, shows diamond size + pitching distance in the header, then a stat grid (game length / pitch type / leads and steals / mercy rule), a daily pitch count callout, and 5 numbered key rules
- "View rules for all divisions" accordion listing all 12 Irvine divisions with their diamond and innings and a download link
- Upcoming Tournaments list filtered by the coach's division against the existing `tournaments` table
- Tournament Rules & Forms section with rulebook download, quick-reference rules link, and the Google Sheet sanction schedule
- Pre-tournament checklist card deep-linking to binder checklist, certifications, and tournament rules

### Commit 5 — Fundraising Subpage + 6 Playbook PDFs (`407ef04`)

**Six fundraising ideas:**
1. **Hit-a-Thon** — per-hit pledges, single-day event, $500-$2,000 yield, Low effort
2. **Home Run Derby Night** — spectator event with pledges and concessions, $1,500-$5,000, Medium effort
3. **Sponsor-a-Banner** — tiered local business outfield banners ($150/$350/$750), $1,000-$5,000, Medium effort
4. **Online Crowdfunding Blast** — Snap! Raise-style automated campaign, $5,000-$25,000, Low effort
5. **Team Raffle with Donated Prizes** — zero-cost raffle from local business prize donations, $500-$3,000, Low-Medium effort
6. **Pie-the-Coach / Dunk Tank** — event add-on at a team gathering, $200-$800, Low effort

(Chosen after a multi-round back-and-forth with user: Restaurant Spirit Night and Angels Group Ticket Fundraiser were proposed and rejected; Snack Bar Takeover was proposed and rejected; Online Crowdfunding and Team Raffle were the final swap-ins.)

**Data file (`src/content/fundraising-ideas.ts`):**
- `FundraisingIdea` interface with name, tagline, description, typical yield, effort, timeline, people, 5 quick steps (for the web page), what-you-need checklist, 8-12 step-by-step playbook, and 3 tips (all three used for the PDF)
- All six ideas drafted with the full playbook content

**PDF generation pipeline:**
- `scripts/dump-fundraising-ideas.mjs` — reads the TS source of truth, extracts the `fundraisingIdeas` array via eval, writes to `src/content/fundraising-ideas.generated.json`
- `scripts/generate-fundraising-playbooks.py` — fpdf2-based generator matching the existing `scripts/generate-portal-guides.py` branding, reads the generated JSON, produces six one-pager printable PDFs with flag-blue header bar, star-gold accent stripe, flag-red divider, numbered steps in blue circles, At a Glance stat box, What You Need checklist, and Tips from Experience section in gold
- Requires a Python venv with fpdf2 (`.venv-fpdf`, gitignored): `python3 -m venv .venv-fpdf && .venv-fpdf/bin/pip install fpdf2`
- To regenerate: `node scripts/dump-fundraising-ideas.mjs && .venv-fpdf/bin/python3 scripts/generate-fundraising-playbooks.py`
- Six PDFs committed to `public/fundraising/` (hit-a-thon, home-run-derby, sponsor-a-banner, crowdfunding, team-raffle, pie-the-coach)

**Fundraising subpage (`src/app/coach/corner/fundraising/page.tsx`):**
- Summary header explaining how to use the playbooks
- Six idea cards, each rendered with a unique lucide icon, effort badge, yield/timeline/people stats, paragraph description, 5 quick-step bullets, and a Download Full Playbook button

### Commit 6 — Premium Brand Makeover (`264a929`)

User feedback after reviewing the deployed chunks: "I don't like how the buttons are very basic. I don't think those follow any of our brand guidelines." Pulled up `tasks/brand-bible.md`, confirmed the brand calls for Oswald uppercase + navy/red/gold + star-pattern-overlay hero treatment, and upgraded the Coach's Corner visuals without generating new art.

**Coach's Corner 2x2 dashboard cards (`src/app/coach/page.tsx`):**
- Live cards are now navy `bg-flag-blue` with the same 4%-opacity star-pattern overlay used in the parent portal hero (`{"★ ".repeat(80)}`)
- Red corner ribbon on the top-left (1px wide vertical stripe + horizontal stripe)
- Star-gold-bright tagline label above the title ("Play Prepared", "Run Your Team", "Fund The Season", "More On Deck")
- Oswald uppercase titles in white
- Icon sits in a `bg-white/10` glass tile with backdrop blur and a star-gold-bright color
- Hover: star-gold hairline sweeps across the top from right to left, the chevron translates right, the whole card lifts with a `shadow-2xl shadow-flag-blue/20`
- Coming Soon card is a gray dashed-border placeholder so the state is unmistakable

**Fundraising page (`src/app/coach/corner/fundraising/page.tsx`):**
- Hero header card matching the navy + star + gold treatment
- Each of the six idea cards has a navy header strip (star pattern, red corner ribbon, gold numbered badge, gold-tinted effort chip, Oswald title in white, gold italic tagline) with a clean white body underneath holding the description, stat chips, and quick steps
- Primary "Download Playbook" CTAs rebuilt as the premium pattern: flag-red base, Oswald uppercase wide tracking, red drop shadow, translate-y lift, active scale, star-gold top hairline animating on hover

**Templates page (`src/app/coach/corner/templates/page.tsx`):**
- Matching hero header card at the top
- Snack schedule template card gets a red top accent ribbon, bordered icon tile, and the upgraded download button

**Tournaments page (`src/app/coach/corner/tournaments/page.tsx`):**
- Matching hero header card at the top
- Your Division Rules card gains the star pattern overlay and red corner ribbon inside the navy header strip
- Primary 2026 PONY Rulebook download button upgraded to the premium CTA treatment

## Deployment

Deployed twice to the VPS via `ssh vps "cd /var/www/irvineallstars && git pull && rm -rf .next && npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && pm2 restart irvineallstars"`:

1. After commit `407ef04` (chunks 1-4)
2. After commit `264a929` (premium makeover)

Both deploys completed cleanly; PM2 `irvineallstars` process restarted online.

## Files Changed

**New files:**
- `docs/plans/2026-04-10-volunteer-ack-and-coaches-corner-design.md`
- `supabase/migrations/20260410_add_volunteer_acknowledgment.sql`
- `src/app/coach/corner/layout.tsx`
- `src/app/coach/corner/tournaments/page.tsx`
- `src/app/coach/corner/templates/page.tsx`
- `src/app/coach/corner/fundraising/page.tsx`
- `src/content/fundraising-ideas.ts`
- `src/content/fundraising-ideas.generated.json`
- `public/rules/2026-pony-baseball-rulebook.pdf`
- `public/templates/snack-schedule.xlsx`
- `public/fundraising/{hit-a-thon,home-run-derby,sponsor-a-banner,crowdfunding,team-raffle,pie-the-coach}-playbook.pdf`
- `scripts/generate-snack-schedule-template.mjs`
- `scripts/dump-fundraising-ideas.mjs`
- `scripts/generate-fundraising-playbooks.py`

**Modified files:**
- `src/app/portal/page.tsx` — volunteer banner, semi-hard gate
- `src/app/coach/page.tsx` — compact Quick Links strip, Coach's Corner navy card grid
- `src/app/admin/tryouts/page.tsx` — Volunteer Ack column + filter chip
- `src/content/divisions.ts` — ruleFamily field, ruleFamilies lookup, matchRuleFamily helper
- `.gitignore` — added `/.venv*` and Python bytecode ignores

## Testing Status

**Built and deployed but NOT yet exercised in the browser by the user.** All functionality needs a manual walkthrough as the first thing in the next session.

## Result

- **Before:** No volunteer gate, no Coach's Corner section, no division rules in-app, no fundraising playbooks
- **After:** Volunteer gate live with admin visibility; Coach's Corner is a premium branded section with Tournaments (division-personalized rules + rulebook PDF + upcoming tournaments), Templates (snack schedule Excel), and Fundraising (six ideas with full printable playbook PDFs); everything uses the same navy + star + gold + Oswald visual language as the rest of the site
