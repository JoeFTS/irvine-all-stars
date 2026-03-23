# Coach Portal Test Report

**Date:** 2026-03-22
**Tester:** Claude (code review + static analysis)
**Method:** Source code review and static route analysis. Live HTTP testing (curl/WebFetch) was unavailable due to tool permissions. HTTP status checks require manual verification.

---

## 1. Route Existence & Page Load Tests

All 11 routes have corresponding source files confirmed in the codebase.

| # | URL | Source File Exists | Expected Behavior | Status |
|---|-----|-------------------|-------------------|--------|
| 1 | `/auth/login` | YES (`src/app/auth/login/page.tsx`) | Renders login form with email + password | PASS (code confirmed) |
| 2 | `/coach` | YES (`src/app/coach/page.tsx`) | Dashboard with team info, compliance, action items, quick links | PASS (code confirmed) |
| 3 | `/coach/tryouts` | YES (`src/app/coach/tryouts/page.tsx`) | Tryout management with player list, status management | PASS (code confirmed) |
| 4 | `/coach/scores` | YES (`src/app/coach/scores/page.tsx`) | Score entry via CSV/XLSX upload | PASS (code confirmed) |
| 5 | `/coach/checklist` | YES (`src/app/coach/checklist/page.tsx`) | 8-section binder checklist with progress bar | PASS (code confirmed) |
| 6 | `/coach/pitching-log` | YES (`src/app/coach/pitching-log/page.tsx`) | Division-specific pitching rules + printable log | PASS (code confirmed) |
| 7 | `/coach/roster` | YES (`src/app/coach/roster/page.tsx`) | Team roster with player details, docs, contacts | PASS (code confirmed) |
| 8 | `/coach/contracts` | YES (`src/app/coach/contracts/page.tsx`) | Signed contracts list with vacation info | PASS (code confirmed) |
| 9 | `/coach/certifications` | YES (`src/app/coach/certifications/page.tsx`) | Concussion + cardiac cert upload, assistant coaches | PASS (code confirmed) |
| 10 | `/coach/tournament-rules` | YES (`src/app/coach/tournament-rules/page.tsx`) | Division-specific tournament rules + acknowledgment | PASS (code confirmed) |
| 11 | `/coach/updates` | YES (`src/app/coach/updates/page.tsx`) | Announcements feed from Supabase | PASS (code confirmed) |

### Authentication & Access Control

- **Layout guard** (`src/app/coach/layout.tsx`): PASS
  - Redirects unauthenticated users to `/auth/login?redirect={currentPath}`
  - Shows "Access denied" for non-coach/non-admin roles
  - Loading state shows centered "Loading..." text
- **Middleware** (`src/middleware.ts`): Pass-through only (auth is client-side via `useAuth()`)
- **Login page**: Correctly reads `?redirect=` param and routes coach/admin/parent to their respective portals

### Sidebar Navigation

- **Desktop sidebar**: 10 nav items confirmed matching all coach routes -- PASS
- **Mobile bottom tabs**: Horizontally scrollable nav with truncated labels (>8 chars get "...") -- PASS
- **Active state highlighting**: Uses `pathname.startsWith(href)` with special case for exact `/coach` match -- PASS
- **User info footer**: Shows role badge + email in sidebar -- PASS

---

## 2. Manual HTTP Tests Required

The following tests could not be run due to tool restrictions. Run these manually:

```bash
# HTTP status checks
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/auth/login
curl -s -o /dev/null -w "%{http_code}" -L https://irvineallstars.com/coach
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/tryouts
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/scores
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/checklist
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/pitching-log
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/roster
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/contracts
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/certifications
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/tournament-rules
curl -s -o /dev/null -w "%{http_code}" https://irvineallstars.com/coach/updates
```

Expected: All return 200 (auth is client-side, so even unauthenticated requests get the HTML shell).

---

## 3. Code Review: Binder Checklist (`/coach/checklist`)

**File:** `src/app/coach/checklist/page.tsx` (1047 lines)

### Findings

| Item | Status | Notes |
|------|--------|-------|
| 8 binder sections render correctly | PASS | Sections 1-8 all present with proper numbering |
| Overall progress bar | PASS | Correctly sums all 8 sections |
| Section 1: Pitching Log link | PASS | Links to `/coach/pitching-log`, handles "no pitching" divisions (Shetland, Machine Pitch) |
| Section 2: Tournament Rules view/print | PASS | Uses `handleViewDocument()` with signed URL |
| Section 3: Insurance certificate view | PASS | Same signed URL pattern |
| Section 4: Medical releases per player | PASS | Shows per-player status, "View" links to `/medical-view?id=` |
| Section 4: Download sign-off sheet | PASS | Links to `/api/medical-release-sheet?division=` with download attribute |
| Section 4: Upload signed release | PASS | FileUpload component with replace logic |
| Section 5: Birth certs + photos per player | PASS | Shows both birth cert and photo buttons when available |
| Section 6-7: Coach certifications | PASS | Links to `/coach/certifications` when missing |
| Section 8: Assistant coach certs | PASS | Only renders when `assistantCoaches.length > 0` |
| Empty state (no Supabase) | PASS | Shows config instruction message |
| Loading skeleton | PASS | 8 animated placeholder blocks |

### Potential Issues Found

1. **BUG (Minor):** `fetchAll()` is called in a `useEffect` but listed without `user` in its internal closure properly -- however, it's called conditionally on `user` change via `useEffect([user])` and the function reads `user` from the component scope. The `eslint-disable-next-line react-hooks/exhaustive-deps` comment suppresses the warning. This works but is not ideal.
   - **Severity:** Low. Functional but could lead to stale closure if `user` changes rapidly.

2. **BUG (Minor):** `handleViewDocument` clicks on null `file_path` -- the button rendering is gated by `birthCert?.file_path` and `photo?.file_path` checks, so the `!` non-null assertion on line 776 (`birthCert.file_path!`) is safe in practice. Same for sections 2, 3, 6, 7.
   - **Severity:** None (properly guarded).

3. **NOTE:** Section 8 (assistant coach certs) is completely hidden when there are zero assistant coaches. This is by design -- the progress bar also excludes `s8Total` when it's 0. Correct behavior.

4. **NOTE:** The checklist queries ALL `tryout_registrations` with status `selected`/`alternate` across ALL divisions (no coach-specific filter). This means every coach sees all players across all divisions. This may be intentional (coordinator role) or a bug depending on requirements.
   - **Recommendation:** If coaches should only see their division's players, add `.eq("division", profile.division)` filter.

---

## 4. Code Review: Pitching Log (`/coach/pitching-log`)

**File:** `src/app/coach/pitching-log/page.tsx` (265 lines)

### Findings

| Item | Status | Notes |
|------|--------|-------|
| Division selector | PASS | 4 divisions: Pinto Kid Pitch, Mustang, Bronco, Pony |
| Print button | PASS | Calls `window.print()` |
| Official PONY Pitching Log button | PASS | Opens external PDF from `cdn1.sportngin.com` in new tab |
| Print styles hook | PASS | Injects `@page { size: landscape }`, hides siblings on print |
| Rest day requirements table | PASS | Dynamic based on selected division |
| Universal pitching rules list | PASS | Rendered from `universalPitchingRules` data |
| Print header/footer | PASS | Only visible in print mode (`hidden print:block`) |

### Potential Issues Found

1. **NOTE:** The "Official PONY Pitching Log" button links to external SportNgin CDN PDFs. These URLs could break if PONY Baseball updates their website.
   - URLs: `cdn1.sportngin.com/attachments/document/8fbf-1583484/...` and `cdn1.sportngin.com/attachments/document/3ffb-1583485/...`
   - **Recommendation:** Consider hosting copies locally as backup.

2. **No auth check on this page** -- the layout handles auth, but this page itself has no `useAuth()`. This is correct since the layout wrapper handles it.

3. **Missing Shetland/Machine Pitch divisions** -- only 4 divisions listed (Pinto Kid Pitch, Mustang, Bronco, Pony). Shetland and Machine Pitch don't have live pitching, so this is correct.

---

## 5. Code Review: Certifications (`/coach/certifications`)

**File:** `src/app/coach/certifications/page.tsx` (472 lines)

### Findings

| Item | Status | Notes |
|------|--------|-------|
| Two cert cards (concussion + cardiac) | PASS | Both render with status badges |
| Resource links (CIF, CDC, NFHS, NAYS) | PASS | All open in new tabs |
| Upload new cert | PASS | Uses FileUpload component |
| View/print uploaded cert | PASS | Creates signed URL from Supabase storage |
| Replace existing cert | PASS | Shows "Replace" FileUpload alongside "View / Print" |
| Status banner (0/2, 1/2, 2/2) | PASS | Green when complete, amber when pending |
| Add assistant coach | PASS | Input with Enter key support + Add button |
| Remove assistant coach | PASS | Delete from `assistant_coaches` table |
| Assistant coach cert uploads | PASS | Separate upload for concussion + cardiac per assistant |
| View uploaded assistant cert | **MISSING** | Assistant coach uploaded certs show "Uploaded (filename)" but no View/Print button |

### Potential Issues Found

1. **BUG (Medium): No View/Print button for assistant coach certificates.** When an assistant coach's cert is uploaded (lines 424-439 and 447-462), it shows a green confirmation with the filename but provides no way to view/print the uploaded file. The head coach certs have a "View / Print" button, but assistant coach certs do not.
   - **Impact:** Coach cannot verify assistant coach certificates are correct after upload.
   - **Fix:** Add a "View" button similar to the head coach cert view, using `supabase.storage.from("player-documents").createSignedUrl(ac.concussion_cert_path, 300)`.

2. **BUG (Minor): `getCert()` filters for `c.completed === true` but `handleUploadComplete` always sets `completed: true`.** If a cert record exists with `completed: false`, re-uploading correctly sets it to `true`. However, the initial `fetchCerts()` fetches ALL cert records regardless of `completed` status. The `getCert()` function then filters client-side. This works but means incomplete records are fetched unnecessarily.
   - **Severity:** Low. No functional impact.

3. **NOTE:** The `coach_certifications` table uses `cert_type` column name, but the dashboard page (`coach/page.tsx` line 139) queries `certification_type`. This is a **potential column name mismatch**.
   - Dashboard: `supabase.from("coach_certifications").select("certification_type")`
   - Certifications page: `supabase.from("coach_certifications").select("*")` and uses `cert_type`
   - **Verdict:** If the actual column is `cert_type`, the dashboard query for `certification_type` silently returns null, and the compliance check would always show certs as incomplete.
   - **Recommendation:** Verify the actual Supabase column name and fix the dashboard query if needed.

4. **NOTE:** The storage bucket used is `"player-documents"` for coach certs too. This works but naming-wise is slightly misleading.

---

## 6. Cross-Page Issues

### Dashboard (`/coach/page.tsx`) Column Name Mismatch

**BUG (High):** The dashboard queries `coach_certifications` with `.select("certification_type")` (line 139) but the certifications page uses `cert_type` as the column name. If the DB column is `cert_type`:
- The dashboard will get rows back but `certification_type` will be `undefined` on each row
- `certTypes` Set on line 211 will contain `undefined`
- `hasConcussion` and `hasCardiac` will always be `false`
- The compliance progress and action items will always show certs as incomplete even when they're uploaded

**Status:** LIKELY BUG -- needs DB schema verification.

### Checklist Sees All Divisions

The checklist page (`/coach/checklist`) fetches ALL registrations with status `selected`/`alternate` without filtering by the coach's division. If multiple coaches exist, each sees all players.

**Status:** Potential design issue -- verify if this is intentional.

---

## 7. Summary

| Category | Total Tests | PASS | FAIL | NEEDS MANUAL |
|----------|-------------|------|------|--------------|
| Route existence | 11 | 11 | 0 | 0 |
| HTTP status codes | 11 | 0 | 0 | 11 |
| Auth/access control | 3 | 3 | 0 | 0 |
| Sidebar navigation | 4 | 4 | 0 | 0 |
| Checklist page | 12 | 12 | 0 | 0 |
| Pitching log page | 7 | 7 | 0 | 0 |
| Certifications page | 10 | 9 | 1 | 0 |
| Cross-page issues | 2 | 0 | 1 | 1 |

### Bugs Found

| # | Severity | Page | Description |
|---|----------|------|-------------|
| 1 | **HIGH** | Dashboard | Column name mismatch: `certification_type` vs `cert_type` -- likely causes compliance progress to always show certs incomplete |
| 2 | **MEDIUM** | Certifications | No View/Print button for assistant coach uploaded certificates |
| 3 | **LOW** | Checklist | No division filter on registrations query -- all coaches see all players |
| 4 | **INFO** | Pitching Log | External PONY PDF URLs could break if SportNgin changes their CDN |

### Overall Assessment

The coach portal is well-structured with a clean layout, proper auth guards, and comprehensive binder tracking. The most critical issue is the likely column name mismatch on the dashboard (`certification_type` vs `cert_type`) which would cause the compliance progress bar to undercount. The missing View/Print button for assistant coach certs is a UX gap. All 11 routes have proper source files and should serve correctly.
