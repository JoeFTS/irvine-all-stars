# Tournament Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add tournament management so coaches and parents see division-filtered tournaments with flyer images and registration links, managed through the admin panel with auto-announce on publish.

**Architecture:** New `tournaments` Supabase table with admin CRUD, dedicated Tournaments tab in coach/parent portals (card grid layout), and auto-announcement integration. Flyer images stored in Supabase Storage. Division filtering uses `division_ids` text array matched against coach's assigned division or parent's player divisions.

**Tech Stack:** Next.js App Router, Supabase (Postgres + Storage), React client components, Tailwind CSS, lucide-react icons, existing FileUpload component.

**Verification:** No test suite — `npm run build` is the primary check. Verify each task compiles.

**Design spec:** `docs/plans/2026-04-04-tournaments-design.md`

---

### Task 1: Create Supabase `tournaments` Table

**Files:**
- Create: `supabase/migrations/20260404_create_tournaments.sql`

**Step 1: Write the migration SQL**

```sql
-- Create tournaments table in irvine_allstars schema
CREATE TABLE IF NOT EXISTS irvine_allstars.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  location text NOT NULL,
  divisions_display text NOT NULL DEFAULT '',
  division_ids text[] NOT NULL DEFAULT '{}',
  registration_url text,
  registration_deadline date,
  host text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  flyer_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  auto_announce boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for filtering by status and date
CREATE INDEX idx_tournaments_status_date ON irvine_allstars.tournaments (status, start_date);

-- Enable RLS
ALTER TABLE irvine_allstars.tournaments ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read published tournaments
CREATE POLICY "Published tournaments are viewable by all"
  ON irvine_allstars.tournaments FOR SELECT
  USING (status = 'published');

-- Policy: admin can do everything (uses profiles.role check)
CREATE POLICY "Admins can manage tournaments"
  ON irvine_allstars.tournaments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Step 2: Run the migration against Supabase**

Run via Supabase dashboard SQL editor or CLI:
```bash
# If using CLI:
npx supabase db push
# Or paste SQL directly in Supabase dashboard → SQL Editor
```

**Step 3: Create Supabase Storage bucket for tournament flyers**

In Supabase dashboard → Storage → Create bucket:
- Name: `tournament-flyers`
- Public: Yes (images need to be publicly accessible)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

Or via SQL:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tournament-flyers', 'tournament-flyers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload flyers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tournament-flyers');

-- Allow public read
CREATE POLICY "Public can view flyers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tournament-flyers');

-- Allow admins to delete
CREATE POLICY "Admins can delete flyers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tournament-flyers');
```

**Step 4: Verify table exists**

Query in Supabase dashboard: `SELECT * FROM irvine_allstars.tournaments LIMIT 1;` — should return empty result, no errors.

**Step 5: Commit**

```bash
git add supabase/migrations/20260404_create_tournaments.sql
git commit -m "feat: add tournaments table migration and storage bucket"
```

---

### Task 2: Admin Tournaments Page — List View

**Files:**
- Create: `src/app/admin/tournaments/page.tsx`

**Context:** Follow the exact pattern from `src/app/admin/announcements/page.tsx` for CRUD structure, state management, and styling. The admin layout already exists and will pick up new pages automatically.

**Step 1: Create the admin tournaments page**

Create `src/app/admin/tournaments/page.tsx` with:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { divisions } from "@/content/divisions";
import { FileUpload } from "@/components/file-upload";
import {
  Plus, Pencil, Trash2, CheckCircle2, AlertCircle,
  Calendar, MapPin, Users, ExternalLink, Trophy
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  divisions_display: string;
  division_ids: string[];
  registration_url: string | null;
  registration_deadline: string | null;
  host: string;
  description: string;
  flyer_url: string | null;
  status: string;
  auto_announce: boolean;
  created_at: string;
  updated_at: string;
}
```

**List view features:**
- Fetch all tournaments: `supabase.from("tournaments").select("*").order("start_date", { ascending: true })`
- Table with columns: Name, Dates (formatted), Divisions (truncated), Status badge, Actions
- Status badges: gray "Draft" (`bg-gray-100 text-gray-600`) or green "Published" (`bg-green-50 text-green-700`)
- Edit button (pencil icon) → populates form
- Delete button (trash icon) → confirm dialog then `.delete().eq("id", id)`
- "Add Tournament" button at top with Plus icon, red pill style

**Step 2: Build and verify**

```bash
cd /Users/joe/irvine-all-stars && npm run build
```

Expected: Compiles successfully, `/admin/tournaments` route appears in build output.

**Step 3: Commit**

```bash
git add src/app/admin/tournaments/page.tsx
git commit -m "feat: admin tournaments list view"
```

---

### Task 3: Admin Tournaments Page — Add/Edit Form

**Files:**
- Modify: `src/app/admin/tournaments/page.tsx`

**Step 1: Add the form below the list**

Form state variables:
```typescript
const [name, setName] = useState("");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [location, setLocation] = useState("");
const [divisionsDisplay, setDivisionsDisplay] = useState("");
const [divisionIds, setDivisionIds] = useState<string[]>([]);
const [registrationUrl, setRegistrationUrl] = useState("");
const [registrationDeadline, setRegistrationDeadline] = useState("");
const [host, setHost] = useState("");
const [description, setDescription] = useState("");
const [flyerUrl, setFlyerUrl] = useState("");
const [status, setStatus] = useState("draft");
const [autoAnnounce, setAutoAnnounce] = useState(true);
const [editingId, setEditingId] = useState<string | null>(null);
```

Form fields (follow announcements page styling — `rounded-xl` inputs, labels with `font-display text-sm`):
- **Name** — text input
- **Start Date / End Date** — date inputs, side by side in a 2-column grid
- **Location** — text input
- **Divisions Display** — text input, placeholder "e.g., Shetland 6, Pinto 8 PP, Mustang 9"
- **Division IDs** — grid of checkboxes (3 columns) using `divisions` from `src/content/divisions.ts`. Each checkbox: `divisions.map(d => ({ id: d.id, label: \`${d.name} ${d.ponyName}\` }))`. Toggle IDs in/out of `divisionIds` array.
- **Registration URL** — text input, optional
- **Registration Deadline** — date input, optional
- **Host** — text input
- **Description** — textarea (3 rows)
- **Flyer Image** — use existing `<FileUpload>` component with `bucket="tournament-flyers"` and `folder="flyers"`. On upload complete, set `flyerUrl` to the returned path. Show preview if flyer exists.
- **Status** — select dropdown: Draft / Published
- **Auto-announce** — checkbox, label "Automatically post announcement when published", checked by default

**Step 2: Add create/update logic**

On submit:
```typescript
const tournamentData = {
  name, start_date: startDate, end_date: endDate, location,
  divisions_display: divisionsDisplay, division_ids: divisionIds,
  registration_url: registrationUrl || null,
  registration_deadline: registrationDeadline || null,
  host, description, flyer_url: flyerUrl || null,
  status, auto_announce: autoAnnounce,
  updated_at: new Date().toISOString(),
};

if (editingId) {
  await supabase.from("tournaments").update(tournamentData).eq("id", editingId);
} else {
  await supabase.from("tournaments").insert(tournamentData);
}
```

**Step 3: Add auto-announce logic**

When saving with `status === "published"` and `autoAnnounce === true`:
- Check if an announcement already exists for this tournament (query announcements where title starts with `"Tournament: "` and contains tournament name)
- If no existing announcement, create one:
```typescript
const dateRange = formatDateRange(startDate, endDate); // "June 6-7, 2026"
await supabase.from("announcements").insert({
  title: `Tournament: ${name} — ${dateRange}`,
  body: `📍 ${location}\n📅 ${dateRange}\n🏟️ Hosted by ${host}\n\nDivisions: ${divisionsDisplay}\n\n${registrationUrl ? `Register here: ${registrationUrl}` : "Registration link coming soon."}${description ? `\n\n${description}` : ""}`,
  division: null, // General — visible to all
});
```

**Step 4: Add a date formatting helper at top of file**

```typescript
function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  if (s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", opts)} - ${e.toLocaleDateString("en-US", opts)}, ${s.getFullYear()}`;
}
```

**Step 5: Build and verify**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add src/app/admin/tournaments/page.tsx
git commit -m "feat: admin tournament add/edit form with auto-announce"
```

---

### Task 4: Add Admin Nav Link for Tournaments

**Files:**
- Modify: `src/app/admin/layout.tsx`

**Step 1: Read the admin layout**

Read `src/app/admin/layout.tsx` to find the navItems array.

**Step 2: Add Tournaments nav item**

Add to navItems array (before or after Announcements):
```typescript
{ href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
```

Import `Trophy` from `lucide-react`.

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: add Tournaments to admin nav"
```

---

### Task 5: Coach Portal — Tournaments Page

**Files:**
- Create: `src/app/coach/tournaments/page.tsx`
- Modify: `src/app/coach/layout.tsx` (add nav item)

**Step 1: Add nav item to coach layout**

In `src/app/coach/layout.tsx`, add to navItems array (before "Updates"):
```typescript
{ href: "/coach/tournaments", label: "Tournaments", icon: Trophy },
```

Import `Trophy` from `lucide-react`.

**Step 2: Create coach tournaments page**

Create `src/app/coach/tournaments/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { StripeDivider } from "@/components/stripe-divider";
import { Calendar, MapPin, ExternalLink, Trophy, X } from "lucide-react";
```

**Data fetching:**
```typescript
// 1. Get coach's division from profiles table
const { data: profile } = await supabase
  .from("profiles")
  .select("division")
  .eq("id", user.id)
  .single();

// 2. Fetch published tournaments that include coach's division
const { data: tournaments } = await supabase
  .from("tournaments")
  .select("*")
  .eq("status", "published")
  .contains("division_ids", [profile.division])
  .order("start_date", { ascending: true });
```

**Page layout — Card Grid (Option A from design):**

- Navy hero section with `grain-overlay`:
  - "TOURNAMENTS" in `font-hero` (Dela Gothic One)
  - Subtitle: "Upcoming tournaments for your division"
  - `<StripeDivider />` below
  - `<div className="baseball-stitch" />` below stripe

- Group tournaments by month:
```typescript
const grouped = tournaments.reduce((acc, t) => {
  const month = new Date(t.start_date + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  if (!acc[month]) acc[month] = [];
  acc[month].push(t);
  return acc;
}, {} as Record<string, Tournament[]>);
```

- Month headers: `font-display text-lg tracking-wider text-charcoal`
- 2-column responsive grid: `grid grid-cols-1 md:grid-cols-2 gap-6`

**Tournament card structure:**
```html
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  <!-- Flyer image (clickable → lightbox) or gradient fallback -->
  <div className="relative aspect-[16/9] cursor-pointer" onClick={() => openLightbox(t.flyer_url)}>
    {t.flyer_url ? (
      <img src={flyerPublicUrl} alt={t.name} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-flag-blue to-flag-blue/80 flex items-center justify-center">
        <Trophy className="w-12 h-12 text-star-gold/40" />
        <span className="font-display text-white text-lg">{t.name}</span>
      </div>
    )}
    <!-- Status badge overlay -->
    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ...">
      {t.registration_url ? "Registration Open" : "Coming Soon"}
    </span>
  </div>

  <div className="p-5 space-y-3">
    <h3 className="font-display text-lg text-charcoal">{t.name}</h3>
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Calendar className="w-4 h-4" /> {formatDateRange(t.start_date, t.end_date)}
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <MapPin className="w-4 h-4" /> {t.location}
    </div>
    <p className="text-sm text-gray-500">Hosted by {t.host}</p>

    <!-- Division pills -->
    <div className="flex flex-wrap gap-1.5">
      {t.divisions_display.split(",").map(d => (
        <span className="px-2 py-0.5 bg-cream text-charcoal text-xs rounded-full font-medium">
          {d.trim()}
        </span>
      ))}
    </div>

    <!-- Register button -->
    {t.registration_url ? (
      <a href={t.registration_url} target="_blank" rel="noopener noreferrer"
         className="block w-full text-center bg-flag-red hover:bg-flag-red-dark text-white font-display text-sm uppercase tracking-wide py-2.5 rounded-full transition-colors">
        Register <ExternalLink className="w-3.5 h-3.5 inline ml-1" />
      </a>
    ) : (
      <div className="block w-full text-center bg-gray-200 text-gray-500 font-display text-sm uppercase tracking-wide py-2.5 rounded-full">
        Coming Soon
      </div>
    )}
  </div>
</div>
```

**Lightbox modal:**
```typescript
const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
// Render overlay when lightboxUrl is set:
{lightboxUrl && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
    <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxUrl(null)}>
      <X className="w-8 h-8" />
    </button>
    <img src={lightboxUrl} alt="Tournament flyer" className="max-w-full max-h-[90vh] rounded-xl" onClick={e => e.stopPropagation()} />
  </div>
)}
```

**Empty state:**
```html
<div className="text-center py-16">
  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
  <h3 className="font-display text-lg text-charcoal">No upcoming tournaments</h3>
  <p className="text-gray-500 text-sm mt-1">Check back soon for tournaments in your division.</p>
</div>
```

**Flyer public URL helper:**
```typescript
function getFlyerUrl(path: string): string {
  if (!supabase) return "";
  const { data } = supabase.storage.from("tournament-flyers").getPublicUrl(path);
  return data.publicUrl;
}
```

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/coach/tournaments/page.tsx src/app/coach/layout.tsx
git commit -m "feat: coach portal tournaments tab with card grid and lightbox"
```

---

### Task 6: Parent Portal — Tournaments Page

**Files:**
- Create: `src/app/portal/tournaments/page.tsx`

**Step 1: Create parent tournaments page**

Same card grid layout as coach page, but with different division filtering:

```typescript
// 1. Get parent's player divisions from tryout_registrations
const { data: registrations } = await supabase
  .from("tryout_registrations")
  .select("division")
  .or(`parent_email.eq.${user.email},secondary_parent_email.eq.${user.email}`);

const playerDivisions = [...new Set(registrations?.map(r => r.division) ?? [])];

// 2. Fetch published tournaments that overlap with any player division
const { data: tournaments } = await supabase
  .from("tournaments")
  .select("*")
  .eq("status", "published")
  .overlaps("division_ids", playerDivisions)
  .order("start_date", { ascending: true });
```

The rest of the page is identical to the coach version — same card grid, lightbox, empty state.

**Step 2: Add a link to the parent portal page**

In `src/app/portal/page.tsx`, add a "View Tournaments" quick link card in the Quick Links section, linking to `/portal/tournaments`. Use Trophy icon.

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/portal/tournaments/page.tsx src/app/portal/page.tsx
git commit -m "feat: parent portal tournaments tab with division-filtered cards"
```

---

### Task 7: Tournament Announcement Badge

**Files:**
- Modify: `src/app/coach/updates/page.tsx`
- Modify: `src/app/portal/page.tsx`

**Step 1: Add "Tournament" tag color to coach updates**

In `src/app/coach/updates/page.tsx`, find where division badges are rendered for announcements. If the announcement title starts with "Tournament:", add a gold badge:

```typescript
{ann.title.startsWith("Tournament:") && (
  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-star-gold/20 text-star-gold-dark">
    Tournament
  </span>
)}
```

**Step 2: Same badge in parent portal announcements**

In `src/app/portal/page.tsx`, find the announcements rendering section (~line 844-871) and add the same Tournament badge logic.

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/coach/updates/page.tsx src/app/portal/page.tsx
git commit -m "feat: gold Tournament badge in announcement feeds"
```

---

### Task 8: Seed Initial Tournament Data & End-to-End Verify

**Step 1: Add the two South Bay tournaments via admin panel**

Navigate to `/admin/tournaments` and add:

**Tournament 1:**
- Name: South Bay Sunset Classic
- Start: 2026-06-06, End: 2026-06-07
- Location: Manhattan Beach & Redondo Beach, CA
- Divisions Display: Shetland 6, Pinto 8 PP, Mustang 9, Mustang 10, Bronco 11, Bronco 12
- Division IDs: check 5u, 6u, 8u-kp, 9u, 10u, 11u, 12u
- Registration URL: https://tourneymachine.com/R178982
- Host: South Bay PONY / Redondo Sunset
- Status: Published
- Auto-announce: checked

**Tournament 2:**
- Name: South Bay MP Classic
- Start: 2026-06-13, End: 2026-06-14
- Location: Manhattan Beach, CA
- Divisions Display: Pinto 7 Machine Pitch, Pinto 8 Machine Pitch
- Division IDs: check 7u-mp, 8u-mp
- Registration URL: https://tourneymachine.com/R179145
- Host: South Bay PONY
- Status: Published
- Auto-announce: checked

**Step 2: Upload the South Bay flyer images**

Upload the flyer images from `docs/assets/` (user will place them there) via the admin form.

**Step 3: Verify end-to-end**

1. Check `/admin/tournaments` — both tournaments listed with green "Published" badges
2. Check `/coach/updates` — two "Tournament:" announcements with gold badges
3. Log in as a coach assigned to a matching division → `/coach/tournaments` shows relevant cards
4. Log in as a parent with a player in a matching division → `/portal/tournaments` shows relevant cards
5. Click a flyer image → lightbox opens with full-size image
6. Click "Register" → opens tourneymachine.com in new tab

**Step 4: Deploy**

```bash
ssh root@89.116.187.214 "cd /var/www/irvineallstars && git pull origin main && npm install --production=false && npm run build && pm2 restart irvineallstars"
```

**Step 5: Commit session log**

```bash
# Update tasks/session-2026-04-04.md with tournament feature work
git add tasks/session-2026-04-04.md
git commit -m "docs: update session log with tournament feature"
```
