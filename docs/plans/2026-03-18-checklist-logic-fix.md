# Checklist Logic, Document Viewing, and Medical Release Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix coach checklist to only show selected/alternate players, let coaches view uploaded docs, add medical release to parent portal.

**Architecture:** Filter all coach-facing queries by player status. Add document viewing via Supabase Storage signed URLs on coach checklist. Add medical release form to parent portal compliance flow.

**Tech Stack:** Next.js App Router, Supabase (REST + Storage), React client components

---

## Summary of Issues

1. **Coach Checklist shows ALL players** (e.g. Max who wasn't selected) — needs `status IN (selected, alternate)` filter
2. **Coach Dashboard counts ALL players** — same filter needed
3. **Coach can't view uploaded docs** (birth cert, photo, contract) — need view/download links
4. **Admin documents page** — already works but verify it's filtering correctly
5. **Medical release not on parent portal** — parents need to fill this out after contract signing
6. **Pitching log** — shown in checklist but no upload mechanism on parent side

---

### Task 1: Filter Coach Checklist to Selected/Alternate Players Only

**Files:**
- Modify: `src/app/coach/checklist/page.tsx`

**What:** The registrations query has NO status filter. Add `.in("status", ["selected", "alternate"])` so only players who made the team appear in the binder checklist.

**Step 1:** Find the Supabase query for `tryout_registrations` and add the status filter.

**Step 2:** Update the "Player Documents" heading count to reflect filtered count.

**Step 3:** Build and verify.

**Step 4:** Commit: `fix: filter coach checklist to only show selected/alternate players`

---

### Task 2: Filter Coach Dashboard Player Count

**Files:**
- Modify: `src/app/coach/page.tsx`

**What:** The dashboard query counts ALL registrations in the division. Filter to selected/alternate only so compliance progress is accurate.

**Step 1:** Find the registrations query and add `.in("status", ["selected", "alternate"])`.

**Step 2:** Build and verify.

**Step 3:** Commit: `fix: filter coach dashboard to count only selected/alternate players`

---

### Task 3: Add Document Viewing to Coach Checklist

**Files:**
- Modify: `src/app/coach/checklist/page.tsx`

**What:** For each player document (birth cert, photo, contract), show a "View" link that opens the uploaded file. Use Supabase Storage signed URLs for documents, and show contract details inline.

**Step 1:** Load `player_documents` with `file_path` field (already fetched).

**Step 2:** For birth cert and photo rows, if uploaded, add a "View" button that creates a signed URL and opens in new tab.

**Step 3:** For contracts, add a "View" link showing signed date, parent signature, planned vacations.

**Step 4:** Build and verify.

**Step 5:** Commit: `feat: add document viewing to coach binder checklist`

---

### Task 4: Add Medical Release to Parent Portal

**Files:**
- Create: `src/app/portal/medical-release/page.tsx`
- Modify: `src/app/portal/page.tsx` (add medical release to compliance checklist)

**What:** After signing the contract, parents should be able to fill out a medical release form. This is step 5 in the compliance flow (after document uploads). The form collects: medical conditions, allergies, medications, insurance info, emergency contacts, and parent signature authorizing medical treatment.

**Step 1:** Create `medical_releases` table in Supabase (or use player_documents with type "medical_release").

**Step 2:** Create the medical release form page at `/portal/medical-release`.

**Step 3:** Add medical release as a gated step in the parent portal compliance checklist.

**Step 4:** Update coach checklist to show medical release status from DB instead of hardcoded "PART OF AFFIDAVIT PAGE 2".

**Step 5:** Build and verify.

**Step 6:** Commit: `feat: add medical release form to parent portal`

---

### Task 5: Verify Admin Document Access

**Files:**
- Review: `src/app/admin/documents/page.tsx`

**What:** Verify admin can see all uploaded documents. Currently filters to `["selected", "confirmed", "tryout_complete", "alternate"]` — this should be fine but verify the signed URL viewing works.

**Step 1:** Test admin documents page on live site.

**Step 2:** Fix any issues found.

---

### Task 6: Deploy and Test on Live Site

**Step 1:** `npm run build`
**Step 2:** Deploy to VPS
**Step 3:** Test coach checklist — verify only selected players show
**Step 4:** Test document viewing — verify coach can see uploaded files
**Step 5:** Test parent portal — verify medical release form works
**Step 6:** Test admin documents — verify admin access
