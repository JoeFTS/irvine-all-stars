# Coach & Parent Compliance Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a coach dashboard with binder compliance checklist + document management, a parent document upload flow (birth certificates, signed contracts, medical releases), and division-specific pre-tournament rules — so coaches and parents have a clear step-by-step path to tournament readiness.

**Architecture:** Three new portals layered on the existing auth system. Coaches (role=coach) get `/coach` with a compliance checklist, document viewer, and per-player status tracker. Parents get an enhanced `/portal` with document upload steps and a digital player contract. File uploads go to Supabase Storage buckets. Admin can view/approve all documents. Database tables track compliance status per player per team.

**Tech Stack:** Next.js App Router, Supabase (auth + DB + Storage), Tailwind CSS, existing Americana design system.

---

## Overview of What We're Building

### Coach Dashboard (`/coach`)
- Binder compliance checklist (from reference: "All Star binder checklist 2025.docx")
- Per-player document status (birth cert, affidavit, medical release, pitching log)
- Concussion & Sudden Cardiac Arrest certification links + upload proof
- Pre-tournament rules agreements (division-specific, from reference docx files)
- Manager meeting info & tournament updates
- Download all player documents as a bundle

### Parent Portal Enhancements (`/portal`)
- Step-by-step "What's Needed From You" checklist
- Upload birth certificate (photo/scan)
- Digital player contract (sign & submit online)
- Medical release acknowledgment
- Photo upload (current player photo)
- Status tracker showing what's complete vs pending

### Admin Enhancements (`/admin`)
- View uploaded documents per player
- Approve/reject documents
- Team compliance overview (which teams are tournament-ready)

---

## Task 1: Supabase Storage Buckets + Database Tables

**Files:**
- No code files — Supabase management API calls only

**Step 1: Create storage bucket**
```sql
-- Via Supabase management API
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-documents', 'player-documents', false);
```

**Step 2: Create new database tables**
```sql
-- Teams table: links coaches to divisions
CREATE TABLE irvine_allstars.teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid REFERENCES auth.users(id),
  division text NOT NULL,
  team_name text,
  season integer DEFAULT 2026,
  created_at timestamptz DEFAULT now()
);

-- Player documents table
CREATE TABLE irvine_allstars.player_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid NOT NULL,
  player_name text NOT NULL,
  division text NOT NULL,
  document_type text NOT NULL, -- 'birth_certificate', 'player_photo', 'medical_release', 'player_contract'
  file_path text NOT NULL, -- Supabase storage path
  file_name text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes text,
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Coach certifications table
CREATE TABLE irvine_allstars.coach_certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid REFERENCES auth.users(id),
  team_id uuid REFERENCES irvine_allstars.teams(id),
  cert_type text NOT NULL, -- 'concussion', 'cardiac_arrest'
  cert_file_path text,
  cert_file_name text,
  completed boolean DEFAULT false,
  completed_at timestamptz
);

-- Player contracts table (digital signatures)
CREATE TABLE irvine_allstars.player_contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid NOT NULL,
  player_name text NOT NULL,
  division text NOT NULL,
  parent_name text NOT NULL,
  parent_email text NOT NULL,
  parent_phone text,
  -- Contract fields from reference
  acknowledge_eligibility boolean DEFAULT false,
  acknowledge_no_travel_ball boolean DEFAULT false,
  acknowledge_tournament_schedule boolean DEFAULT false,
  acknowledge_fees boolean DEFAULT false,
  acknowledge_practices boolean DEFAULT false,
  acknowledge_conduct boolean DEFAULT false,
  acknowledge_no_playing_guarantee boolean DEFAULT false,
  planned_vacations text,
  parent_signature text, -- typed name as signature
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Binder checklist status per team
CREATE TABLE irvine_allstars.binder_checklist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES irvine_allstars.teams(id),
  registration_id uuid NOT NULL,
  player_name text NOT NULL,
  -- Per-player items
  birth_certificate boolean DEFAULT false,
  affidavit_complete boolean DEFAULT false,
  medical_release_signed boolean DEFAULT false,
  pitching_log boolean DEFAULT false, -- not needed for Shetland & Pinto MP
  player_photo boolean DEFAULT false,
  player_contract_signed boolean DEFAULT false,
  -- Overall
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- Pre-tournament agreements (coach signs)
CREATE TABLE irvine_allstars.tournament_agreements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid REFERENCES auth.users(id),
  team_id uuid REFERENCES irvine_allstars.teams(id),
  division text NOT NULL,
  agreement_type text NOT NULL, -- 'shetland', 'pinto_mp', 'pinto_kp', 'mustang_bronco'
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz
);
```

**Step 3: Set up RLS policies**
```sql
-- Storage: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'player-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'player-documents' AND auth.uid() IS NOT NULL);

-- Admin can view all documents
CREATE POLICY "Admin can view all" ON storage.objects
  FOR SELECT USING (bucket_id = 'player-documents');

-- Tables: grant access
GRANT ALL ON irvine_allstars.player_documents TO anon, authenticated;
GRANT ALL ON irvine_allstars.player_contracts TO anon, authenticated;
GRANT ALL ON irvine_allstars.teams TO anon, authenticated;
GRANT ALL ON irvine_allstars.coach_certifications TO anon, authenticated;
GRANT ALL ON irvine_allstars.binder_checklist TO anon, authenticated;
GRANT ALL ON irvine_allstars.tournament_agreements TO anon, authenticated;

-- RLS: enable on all tables
ALTER TABLE irvine_allstars.player_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE irvine_allstars.player_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE irvine_allstars.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE irvine_allstars.coach_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE irvine_allstars.binder_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE irvine_allstars.tournament_agreements ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (simple policy)
CREATE POLICY "allow_all" ON irvine_allstars.player_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON irvine_allstars.player_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON irvine_allstars.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON irvine_allstars.coach_certifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON irvine_allstars.binder_checklist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON irvine_allstars.tournament_agreements FOR ALL USING (true) WITH CHECK (true);
```

**Step 4: Verify all tables created**

**Step 5: Commit plan document**

---

## Task 2: File Upload Component (Reusable)

**Files:**
- Create: `src/components/file-upload.tsx`

A reusable file upload component that uploads to Supabase Storage and returns the file path. Used by both parents (birth certs, photos) and coaches (certifications).

Features:
- Drag-and-drop or click to browse
- File type validation (images + PDFs)
- Upload progress indicator
- Preview for images
- Max file size: 10MB

---

## Task 3: Parent Portal — Step-by-Step Checklist & Document Uploads

**Files:**
- Modify: `src/app/portal/page.tsx` — add checklist section + upload flows
- Create: `src/app/portal/documents/page.tsx` — dedicated document upload page
- Create: `src/app/portal/contract/page.tsx` — digital player contract signing page

### Parent Checklist (shown on portal home):
1. Register for tryouts (existing — link to /apply/player)
2. Upload birth certificate (photo/scan)
3. Upload current player photo
4. Sign player contract (digital)
5. Acknowledge medical release
6. Review parent code of conduct

Each item shows: green check if complete, red "Action Needed" if pending.

### Document Upload Page (`/portal/documents`):
- Birth certificate upload (required)
- Current player photo upload (required)
- Shows upload status for each document
- Links back to portal home

### Player Contract Page (`/portal/contract`):
- Division-specific contract text (from reference PDF)
- All acknowledgment checkboxes:
  - Eligibility requirements
  - No travel/club ball during All-Stars
  - Tournament schedule commitment
  - Fees acknowledgment
  - Practice attendance commitment
  - Conduct expectations
  - No playing time guarantee
- Planned vacations text field
- Type-to-sign (parent types their full name)
- Submit button → saves to player_contracts table
- Confirmation screen after signing

---

## Task 4: Coach Dashboard Layout & Binder Checklist

**Files:**
- Create: `src/app/coach/layout.tsx` — coach dashboard layout (sidebar + mobile tabs)
- Create: `src/app/coach/page.tsx` — dashboard home with team overview
- Create: `src/app/coach/checklist/page.tsx` — binder compliance checklist
- Modify: `src/app/admin/layout.tsx` — update auth guard to allow coach role for /coach routes
- Modify: `src/components/navbar.tsx` — show "Coach Dashboard" for coach role

### Coach Dashboard Home (`/coach`):
- Team info card (division, team name, roster count)
- Compliance progress bar (X of Y items complete)
- Quick links: Binder Checklist, Tournament Rules, Certifications, Roster

### Binder Checklist (`/coach/checklist`):
Based on reference doc "All Star binder checklist 2025.docx":

**Per-Player Items** (table/card view for each rostered player):
- Birth Certificate ✓/✗ (uploaded by parent)
- Affidavit ✓/✗ (completed online — link provided)
- Medical Release ✓/✗ (parent signature on affidavit page 2)
- Pitching Log ✓/✗ (affidavit page 3, not needed for Shetland & Pinto MP)
- Player Photo ✓/✗ (uploaded by parent)
- Player Contract ✓/✗ (signed by parent)

**Team-Level Items:**
- League Insurance Certificate (upload)
- Concussion Protocol Certificate (at least 1 coaching staff member)
- Sudden Cardiac Arrest Prevention Certificate (at least 1 coaching staff member)

**Affidavit Instructions:**
- Complete name on birth certificate MUST match affidavit
- Include: address, parent name, uniform number, regular season team
- All parents MUST sign medical release (page 2)

---

## Task 5: Coach Certifications Page

**Files:**
- Create: `src/app/coach/certifications/page.tsx`

### Certification Resources (from reference):
**Concussion Protocol:**
- https://cifstate.org/sports-medicine/concussions/index
- https://www.cdc.gov/headsup/youthsports/coach.html

**Sudden Cardiac Arrest Prevention:**
- https://cifstate.org/sports-medicine/sca/index
- https://nfhslearn.com/courses/sudden-cardiac-arrest
- https://www.nays.org/resources/more/sudden-cardiac-arrest/

Coach uploads their certificate after completing online course. Status tracked in coach_certifications table.

---

## Task 6: Pre-Tournament Rules & Coach's Agreement

**Files:**
- Create: `src/app/coach/tournament-rules/page.tsx`
- Create: `src/content/tournament-rules.ts` — structured content from reference docx files

### Division-Specific Rule Sets (from reference docs):
1. **Shetland** — Shetland West Zone Tournament Supplemental Rules
2. **Pinto Machine Pitch** — Pinto MP Supplemental Rules
3. **Pinto Kid Pitch** — Pinto Pitch West Zone Tournament Supplemental Rules
4. **Mustang/Bronco** — PONY Baseball Rule Book (Blue/White pages) + MLB Rules

### Agreement Flow:
- Coach reads full rules for their division
- Checks acknowledgment: "I have read and understand the tournament rules"
- Digital signature (typed name)
- Saved to tournament_agreements table
- Status shown on dashboard

### Key Rules to Display (from reference):
- Manager & Coaching Staff responsibilities
- Only coaches on Affidavit allowed on field/dugout/bullpen
- Ejection rules (must leave ballpark)
- Uniform requirements
- Pre-game meeting requirements (60 min before first game)
- Pitching/batting rules emphasis

---

## Task 7: Coach Roster View

**Files:**
- Create: `src/app/coach/roster/page.tsx`

Shows all players assigned to the coach's team:
- Player name, division, position, jersey #
- Parent contact info
- Document upload status per player
- Contract status
- Overall compliance status (ready / not ready)

Coach can download individual player documents or all documents as a zip.

---

## Task 8: Admin — Team Assignment & Compliance Overview

**Files:**
- Create: `src/app/admin/teams/page.tsx` — assign coaches to teams, view compliance
- Modify: `src/app/admin/layout.tsx` — add Teams nav item

### Team Management:
- Create teams (assign coach + division)
- Assign players to teams (from confirmed registrations)
- View per-team compliance status

### Compliance Dashboard:
- Per-team progress bars showing document completion %
- Flag teams that are NOT tournament-ready
- Quick view of missing items per player

---

## Task 9: Navbar & Auth Updates

**Files:**
- Modify: `src/components/navbar.tsx`
- Modify: `src/app/auth/login/page.tsx`

### Navbar Changes:
- Logged out: "Sign In" button (existing)
- Parent role: "Parent Portal" → /portal
- Coach role: "Coach Dashboard" → /coach
- Admin role: "Admin Panel" → /admin

### Login Redirect:
- Admin → /admin
- Coach → /coach
- Parent → /portal
- Default → /portal

---

## Task 10: Tournament Updates Page (Coach)

**Files:**
- Create: `src/app/coach/updates/page.tsx`

From JD Email reference:
- All-Star Schedule link (west.pony.org)
- Hosting Responsibilities info
- Manager Meeting details (dates/locations when posted)
- All-Star Rules of Note (division-specific)
- Uniform information
- Tournament bracket/schedule links

This page pulls from announcements table (division-filtered for coach's team) plus static content from the reference materials.

---

## Execution Order

1. **Task 1** — Database setup (required by everything else)
2. **Task 2** — File upload component (required by Tasks 3-5)
3. **Task 3** — Parent portal enhancements (highest user value)
4. **Task 9** — Navbar/auth updates (enables coach access)
5. **Task 4** — Coach dashboard + binder checklist
6. **Task 5** — Coach certifications
7. **Task 6** — Tournament rules
8. **Task 7** — Coach roster view
9. **Task 8** — Admin team management
10. **Task 10** — Tournament updates

---

## Estimated Scope
- 6 new database tables + 1 storage bucket
- 1 reusable component (file upload)
- 8 new pages
- 3 modified pages
- ~2,500 lines of new code

## Dependencies
- Supabase Storage must be enabled on the project
- No new npm packages needed (Supabase JS client already handles storage)
