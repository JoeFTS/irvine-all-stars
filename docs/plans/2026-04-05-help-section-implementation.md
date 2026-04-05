# Help Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add in-portal help pages (accordion format) and contextual `?` tooltips on page headers for admin, coach, and parent portals.

**Architecture:** Three `"use client"` help pages with hardcoded accordion content (one per role), a reusable `HelpTooltip` component for page-header popovers, and sidebar nav additions. Reuses the existing `FaqAccordion` component pattern from the FAQ page.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Lucide React icons, existing FaqAccordion component

**Design doc:** `docs/plans/2026-04-05-help-section-design.md`

---

### Task 1: HelpTooltip Component

**Files:**
- Create: `src/components/help-tooltip.tsx`

**Step 1: Create the component**

A client component that renders a `HelpCircle` icon next to page titles. On click, shows a popover with a one-line description and a "View full guide" link.

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import Link from "next/link";

interface HelpTooltipProps {
  text: string;
  guideUrl: string;
}

export function HelpTooltip({ text, guideUrl }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="ml-2 text-gray-400 hover:text-flag-blue transition-colors"
        aria-label="Help"
      >
        <HelpCircle size={20} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{text}</p>
          <Link
            href={guideUrl}
            className="text-sm font-semibold text-flag-blue hover:text-flag-red transition-colors"
            onClick={() => setOpen(false)}
          >
            View full guide &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/joe/irvine-all-stars && npx tsc --noEmit src/components/help-tooltip.tsx 2>&1 || npm run build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/components/help-tooltip.tsx
git commit -m "feat: add HelpTooltip component — click ? icon for page-level help popover"
```

---

### Task 2: Coach Help Page

**Files:**
- Create: `src/app/coach/help/page.tsx`

**Step 1: Create the coach help page**

Uses the existing `FaqAccordion` component with coach-specific content. Each section maps to a coach sidebar nav item with matching Lucide icon.

```tsx
"use client";

import { FaqAccordion, FaqSection } from "@/components/faq-accordion";
import {
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  ClipboardCheck,
  ClipboardList,
  Users,
  FileText,
  Award,
  BookOpen,
  Trophy,
  Megaphone,
} from "lucide-react";

const helpSections: FaqSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "Dashboard",
        answer: (
          <>
            <p className="mb-3">
              Your home base — see your team assignment, compliance progress, action items, and the latest announcements at a glance.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Check the compliance progress bar to see what still needs to be done</li>
              <li>Review action items — these are things that need your attention</li>
              <li>Use the quick links to jump to any section of the portal</li>
              <li>Scroll down to see the latest announcements for your division</li>
            </ol>
            <p className="text-xs text-gray-500 italic">Good to know: The dashboard updates in real-time as parents upload documents and you complete tasks.</p>
          </>
        ),
      },
    ],
  },
  {
    title: "Tryouts & Evaluation",
    items: [
      {
        question: "Tryouts",
        answer: (
          <>
            <p className="mb-3">
              Scout players and submit nominations for your division&apos;s tryouts.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>View the list of registered players for your division</li>
              <li>Review player details and regular-season performance</li>
              <li>Submit your nominations and recommendations</li>
            </ol>
          </>
        ),
      },
      {
        question: "Enter Scores",
        answer: (
          <>
            <p className="mb-3">
              Score players during tryout evaluations using the standardized 54-point rubric.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Select the tryout session you&apos;re evaluating</li>
              <li>Score each player on hitting, fielding, throwing, running, effort, and attitude (1-9 each)</li>
              <li>Submit your scores when you&apos;re done — they&apos;re saved automatically as you go</li>
            </ol>
            <p className="text-xs text-gray-500 italic">Good to know: Scores are locked after the tryout period ends. Make sure to complete all evaluations on time.</p>
          </>
        ),
      },
    ],
  },
  {
    title: "Team Management",
    items: [
      {
        question: "Binder Checklist",
        answer: (
          <>
            <p className="mb-3">
              Track required documents for each player on your roster — birth certificates, player photos, contracts, and certifications.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Open the checklist to see all players and their document status</li>
              <li>Green checkmarks mean the document is uploaded and verified</li>
              <li>Yellow means pending, red means missing</li>
              <li>Click a player to see which specific documents are needed</li>
            </ol>
            <p className="text-xs text-gray-500 italic">Good to know: Documents are uploaded by parents through their portal — you just track the status here.</p>
          </>
        ),
      },
      {
        question: "Pitching Log",
        answer: (
          <>
            <p className="mb-3">
              Log pitch counts for every game to stay compliant with PONY pitching rules.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>After each game, open the pitching log</li>
              <li>Select the date and the pitcher</li>
              <li>Enter the number of pitches thrown</li>
              <li>The system automatically calculates required rest days</li>
            </ol>
            <p className="text-xs text-gray-500 italic">Good to know: Pitching rules vary by division. The log shows your division&apos;s specific limits.</p>
          </>
        ),
      },
      {
        question: "Roster",
        answer: (
          <>
            <p className="mb-3">
              View your complete team roster with player details and contact information.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>View all players assigned to your team</li>
              <li>See player details including age, position, and parent contact info</li>
              <li>Use this as your reference for practices and games</li>
            </ol>
          </>
        ),
      },
      {
        question: "Contracts",
        answer: (
          <>
            <p className="mb-3">
              Track which players have signed their participation contracts.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>View the contract status for each player on your roster</li>
              <li>Signed contracts show a green checkmark</li>
              <li>Follow up with parents who haven&apos;t signed yet</li>
            </ol>
          </>
        ),
      },
    ],
  },
  {
    title: "Compliance & Rules",
    items: [
      {
        question: "Certifications",
        answer: (
          <>
            <p className="mb-3">
              Upload your required coaching certifications — concussion awareness and cardiac arrest training.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Upload your concussion awareness certificate</li>
              <li>Upload your cardiac arrest training certificate</li>
              <li>Both certifications must be current and valid</li>
            </ol>
            <p className="text-xs text-gray-500 italic">Good to know: You cannot manage a team until both certifications are uploaded and verified.</p>
          </>
        ),
      },
      {
        question: "Tournament Rules",
        answer: (
          <>
            <p className="mb-3">
              Review the official tournament rules and acknowledge that you&apos;ve read and understood them.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Read through all tournament rules carefully</li>
              <li>Click &quot;Acknowledge&quot; at the bottom to confirm you&apos;ve read them</li>
              <li>This is required before your team can participate in tournaments</li>
            </ol>
          </>
        ),
      },
    ],
  },
  {
    title: "Tournaments & Updates",
    items: [
      {
        question: "Tournaments",
        answer: (
          <>
            <p className="mb-3">
              View the tournament schedule for your division — dates, locations, registration links, and flyers.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Browse upcoming tournaments grouped by month</li>
              <li>Click on a tournament to see full details</li>
              <li>Use the registration link to sign up your team</li>
              <li>Click flyer images to view them full-size</li>
            </ol>
          </>
        ),
      },
      {
        question: "Updates",
        answer: (
          <>
            <p className="mb-3">
              Read the latest announcements and updates from the All-Stars admin.
            </p>
            <p className="font-semibold text-charcoal mb-1">How to use it:</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Announcements are shown newest first</li>
              <li>You&apos;ll see both general announcements and ones specific to your division</li>
              <li>Check back regularly for schedule changes and important updates</li>
            </ol>
          </>
        ),
      },
    ],
  },
];

export default function CoachHelpPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <p className="text-flag-red font-display text-sm font-semibold uppercase tracking-[3px] mb-1">
        Coach
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mb-8">
        Help & Guides
      </h1>
      <FaqAccordion sections={helpSections} />
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/joe/irvine-all-stars && npm run build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/app/coach/help/page.tsx
git commit -m "feat: add coach help page — 11 accordion sections covering all coach portal features"
```

---

### Task 3: Admin Help Page

**Files:**
- Create: `src/app/admin/help/page.tsx`

**Step 1: Create the admin help page**

Same accordion pattern as coach help, with admin-specific content covering all 10 admin features.

Content for the 10 sections:

1. **Dashboard** — Overview stats at a glance: coach applications, player registrations, division breakdown.
   - Steps: Review counts, click into sections that need attention, check recent activity
2. **Coach Applications** — Review, approve, or decline coach applications.
   - Steps: View pending applications, read application details, approve or decline with notes
3. **Scores** — View tryout evaluation scores across all players and divisions.
   - Steps: Select a division, view scores sorted by total, compare players side by side
4. **Announcements** — Create and post announcements to coaches and parents.
   - Steps: Write title and body, optionally select a division (or leave blank for all), click Post
   - Tip: Division-specific announcements only show to coaches/parents in that division
5. **Tournaments** — Add tournaments, upload flyers, and publish to portals.
   - Steps: Click Add Tournament, fill in details, upload flyer image, save as draft, publish when ready
   - Tip: Publishing a tournament automatically creates an announcement
6. **Teams** — Assign selected players to their teams after tryouts.
   - Steps: Select a division, drag players into team slots, save assignments
7. **Tryouts** — Manage registrations, view player selections, and review coach recommendations.
   - Steps: View registered players by division, review evaluator scores, make selections
8. **Invites** — Send invite links to coaches and parents via email.
   - Steps: Enter email address, select role (coach or parent), send invite, track who accepted
9. **Documents** — Manage policies and public-facing documents.
   - Steps: View existing documents, edit content, toggle visibility
10. **Compliance** — Track compliance requirements across all teams and coaches.
    - Steps: View compliance dashboard, check which coaches are missing certifications, follow up

**Step 2: Verify**

Run: `npm run build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/app/admin/help/page.tsx
git commit -m "feat: add admin help page — 10 accordion sections covering all admin features"
```

---

### Task 4: Parent Help Page

**Files:**
- Create: `src/app/portal/help/page.tsx`

**Step 1: Create the parent help page**

Same accordion pattern, with parent-specific content covering all 6 portal features. Note: parent portal pages don't use the sidebar layout, so this page should match the portal page style.

Content for 6 sections:

1. **Dashboard** — Your player's status, tryout details, upcoming dates, and announcements.
   - Steps: Check registration status, view tryout session details (date/time/location), scroll for announcements
2. **Tournaments** — View the tournament schedule for your player's division.
   - Steps: Browse upcoming tournaments, view dates and locations, click flyers for details, use registration links
3. **Documents** — Download and review required documents and policies.
   - Steps: View the document list, click to download or read, check which ones you need
4. **Contract** — View and sign your player's participation contract.
   - Steps: Read the contract carefully, sign electronically at the bottom, submit
   - Tip: Both parents/guardians may need to sign depending on division requirements
5. **Medical Release** — Submit your player's medical release form.
   - Steps: Fill in medical information, list allergies and conditions, sign and submit
6. **Confirm** — Confirm your player's selection and registration after being selected.
   - Steps: Review the selection details, confirm availability and commitment, submit confirmation

**Step 2: Verify**

Run: `npm run build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/app/portal/help/page.tsx
git commit -m "feat: add parent help page — 6 accordion sections covering all portal features"
```

---

### Task 5: Add Help to Sidebar Navigation

**Files:**
- Modify: `src/app/admin/layout.tsx` (line 30, after compliance nav item)
- Modify: `src/app/coach/layout.tsx` (line 32, after updates nav item)

**Step 1: Add Help nav item to admin sidebar**

In `src/app/admin/layout.tsx`:
- Add `HelpCircle` to the Lucide imports
- Add `{ href: "/admin/help", label: "Help", icon: HelpCircle }` as the last item in `navItems` array

**Step 2: Add Help nav item to coach sidebar**

In `src/app/coach/layout.tsx`:
- Add `HelpCircle` to the Lucide imports
- Add `{ href: "/coach/help", label: "Help", icon: HelpCircle }` as the last item in `navItems` array

**Step 3: Add Help link to parent portal**

Check how parent portal navigation works (it may be in `src/app/portal/page.tsx` as quick links or in the navbar). Add a Help link pointing to `/portal/help`.

**Step 4: Verify**

Run: `npm run build 2>&1 | tail -10`

**Step 5: Commit**

```bash
git add src/app/admin/layout.tsx src/app/coach/layout.tsx
git commit -m "feat: add Help nav item to admin and coach sidebars"
```

---

### Task 6: Add HelpTooltips to Coach Pages

**Files:**
- Modify: All coach page files that have an H1 page title

**Step 1: Identify all coach pages with H1 headers**

Search for `<h1` in all files under `src/app/coach/`. For each page, add the `HelpTooltip` component inline after the page title text.

Pattern to follow — change:
```tsx
<h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
  Binder Checklist
</h1>
```

To:
```tsx
<h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center">
  Binder Checklist
  <HelpTooltip
    text="Track required documents like birth certificates, photos, and contracts for your team."
    guideUrl="/coach/help#binder-checklist"
  />
</h1>
```

Add `import { HelpTooltip } from "@/components/help-tooltip";` to each file.

**Tooltip text for each coach page:**
- Dashboard: "Your home base with compliance progress, action items, and announcements."
- Tryouts: "Scout players and submit nominations for your division."
- Enter Scores: "Score players during tryout evaluations using the 54-point rubric."
- Binder Checklist: "Track required documents like birth certificates, photos, and contracts for your team."
- Pitching Log: "Log pitch counts after each game to stay compliant with PONY rules."
- Roster: "View your complete team roster with player details and contact info."
- Contracts: "Track which players have signed their participation contracts."
- Certifications: "Upload your required concussion and cardiac arrest training certificates."
- Tournament Rules: "Review and acknowledge the official tournament rules."
- Tournaments: "View upcoming tournament schedule, locations, and registration links."
- Updates: "Read the latest announcements and updates from the admin."

**Step 2: Verify**

Run: `npm run build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/app/coach/
git commit -m "feat: add HelpTooltip to all coach page headers"
```

---

### Task 7: Add HelpTooltips to Admin Pages

**Files:**
- Modify: All admin page files that have an H1 page title

**Step 1: Same pattern as Task 6, but for admin pages**

**Tooltip text for each admin page:**
- Dashboard: "Overview stats — coach applications, player registrations, and division breakdown."
- Coach Applications: "Review, approve, or decline coach applications."
- Scores: "View tryout evaluation scores across all players and divisions."
- Announcements: "Create and post announcements to coaches and parents."
- Tournaments: "Add tournaments, upload flyers, and publish to coach and parent portals."
- Teams: "Assign selected players to their teams after tryouts."
- Tryouts: "Manage tryout registrations, player selections, and coach recommendations."
- Invites: "Send invite links to coaches and parents via email."
- Documents: "Manage policies and public-facing documents."
- Compliance: "Track compliance requirements across all teams and coaches."

**Step 2: Verify**

Run: `npm run build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add HelpTooltip to all admin page headers"
```

---

### Task 8: Add HelpTooltips to Parent Portal Pages

**Files:**
- Modify: All portal page files that have an H1 page title

**Step 1: Same pattern as Task 6, but for portal pages**

**Tooltip text for each portal page:**
- Dashboard: "Your player's registration status, tryout details, and announcements."
- Tournaments: "View the tournament schedule for your player's division."
- Documents: "Download and review required documents and policies."
- Contract: "View and sign your player's participation contract."
- Medical Release: "Submit your player's medical release form."
- Confirm: "Confirm your player's selection and complete registration."

**Step 2: Verify**

Run: `npm run build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/app/portal/
git commit -m "feat: add HelpTooltip to all parent portal page headers"
```

---

### Task 9: Build Verification & Deploy

**Step 1: Full build check**

Run: `cd /Users/joe/irvine-all-stars && npm run build`

Expected: Clean build with no errors. All 3 help pages should appear in the build output.

**Step 2: Verify pages render**

Start dev server and check:
- `/admin/help` — should show 10 accordion sections
- `/coach/help` — should show 11 accordion sections grouped into 5 categories
- `/portal/help` — should show 6 accordion sections
- Click any `?` icon on a page header — should show popover with text and "View full guide" link
- Click "View full guide" — should navigate to the correct help page

**Step 3: Deploy to VPS**

```bash
ssh root@89.116.187.214 "cd /var/www/instantbookclub && git pull origin main && npm install --production=false && npm run build && pm2 restart instantbookclub"
```

Wait — this is the irvine-all-stars project, not IBC. Check what the deploy process is for this project.

**Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "feat: complete help section — 3 help pages, tooltips on all portal headers, sidebar nav"
```
