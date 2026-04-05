# Help Section — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Overview

In-portal help system with two parts: dedicated help pages per role (collapsible accordion) and contextual `?` tooltips on every page header. Sidebar nav link for discoverability.

## Help Pages

Three pages, one per role:
- `/admin/help`
- `/coach/help`
- `/portal/help`

### Layout
- Header: Role label (e.g. "COACH" in flag-red) + "HELP & GUIDES" in Dela Gothic One
- Collapsible accordion sections, one per feature, ordered to match sidebar nav
- Each section has the matching Lucide icon from the sidebar

### Accordion Section Structure
- **Collapsed:** Icon + feature name + chevron
- **Expanded:**
  - One-sentence summary
  - "How to use it" — 3-5 numbered steps
  - "Good to know" — 1-2 tips (where relevant)

### Content — Admin Help (10 sections)
1. Dashboard — overview stats, quick glance at applications/registrations
2. Coach Applications — review, approve, or decline coach applications
3. Scores — view tryout evaluation scores across all players
4. Announcements — create and post announcements to coaches and parents
5. Tournaments — add tournaments, upload flyers, publish to portals
6. Teams — assign players to teams after selections
7. Tryouts — manage registrations, player selections, and coach recommendations
8. Invites — send invite links to coaches and parents
9. Documents — manage policies and public documents
10. Compliance — track compliance requirements across teams

### Content — Coach Help (11 sections)
1. Dashboard — home base with compliance progress and action items
2. Tryouts — scout players and submit nominations
3. Enter Scores — score players during tryout evaluations
4. Binder Checklist — track required documents for roster
5. Pitching Log — log pitch counts for compliance
6. Roster — view team roster and player details
7. Contracts — manage player contracts
8. Certifications — upload concussion and cardiac arrest certs
9. Tournament Rules — review and acknowledge rules
10. Tournaments — view upcoming tournament schedule
11. Updates — read announcements from admin

### Content — Parent Help (6 sections)
1. Dashboard — player status, tryout details, announcements
2. Tournaments — tournament schedule for player's division
3. Documents — download and review required documents
4. Contract — view and sign player's contract
5. Medical Release — submit medical release forms
6. Confirm — confirm player's selection and registration

### All content hardcoded in components — no database or CMS.

## Contextual Tooltips

### Component: `HelpTooltip`
Reusable component at `src/components/help-tooltip.tsx`.

```tsx
<HelpTooltip
  text="Track required documents for your team."
  guideUrl="/coach/help#binder-checklist"
/>
```

### Placement
Next to page title/H1 on every portal page (admin, coach, parent).

### Behavior
- Click `HelpCircle` icon (16px, muted gray) to open popover
- Click again or outside to close
- Popover contains one-line description + "View full guide →" link
- Link navigates to the role's help page with anchor scroll to relevant section

### Popover Style
- Small card below the icon
- White background, subtle shadow, rounded corners
- Text in DM Sans/Rubik (body font)
- "View full guide →" in flag-blue

## Navigation

### Sidebar Addition
Add "Help" with `HelpCircle` icon at the bottom of:
- Admin sidebar (`src/app/admin/layout.tsx`)
- Coach sidebar (`src/app/coach/layout.tsx`)
- Parent portal nav (wherever nav links are rendered)

## File Structure

```
src/
  components/
    help-tooltip.tsx          # Reusable ? popover component
  app/
    admin/help/page.tsx       # Admin help page (10 accordion sections)
    coach/help/page.tsx       # Coach help page (11 accordion sections)
    portal/help/page.tsx      # Parent help page (6 accordion sections)
```

Plus edits to:
- `src/app/admin/layout.tsx` — add Help nav item
- `src/app/coach/layout.tsx` — add Help nav item
- Parent portal nav — add Help nav item
- All portal page files — add `<HelpTooltip>` to page headers

## Design System
- No new dependencies
- Lucide icons: `HelpCircle`, `ChevronDown`, `ChevronUp`
- Colors: existing palette (flag-blue, flag-red, star-gold, white, gray)
- Typography: Dela Gothic One (page title), Oswald (section headers), Rubik (body)
- Accordion pattern: matches existing FAQ page
