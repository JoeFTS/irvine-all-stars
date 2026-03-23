# Admin Portal Test Report

**Date:** 2026-03-22
**Tester:** Claude (automated code review + HTTP checks)

---

## 1. HTTP Status Code Tests

| # | Page | URL | Expected | Actual | Result |
|---|------|-----|----------|--------|--------|
| 1 | Dashboard | `/admin` | 200 | 200 | PASS |
| 2 | Coach Applications | `/admin/applications` | 200 | 200 | PASS |
| 3 | Scores | `/admin/scores` | 200 | 200 | PASS |
| 4 | Announcements | `/admin/announcements` | 200 | 200 | PASS |
| 5 | Teams | `/admin/teams` | 200 | 200 | PASS |
| 6 | Tryouts | `/admin/tryouts` | 200 | 200 | PASS |
| 7 | Invites | `/admin/invites` | 200 | 200 | PASS |
| 8 | Documents | `/admin/documents` | 200 | 200 | PASS |
| 9 | Compliance | `/admin/compliance` | 200 | 200 | PASS |

All 9 admin pages return HTTP 200. **9/9 PASS.**

---

## 2. Admin Layout & Auth Guard

**File:** `src/app/admin/layout.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Auth guard (redirect if not logged in) | PASS | Redirects to `/auth/login?redirect=` with current path |
| Role check (admin only) | PASS | Shows "Access denied" for non-admin roles |
| Loading state | PASS | Shows loading indicator while auth state resolves |
| Sidebar navigation (desktop) | PASS | All 9 nav items listed, correct icons |
| Mobile bottom tabs | PASS | Horizontally scrollable, labels truncated at 8 chars |
| Active link highlighting | PASS | Dashboard exact match, others use `startsWith` |

---

## 3. Dashboard (`/admin`)

**File:** `src/app/admin/page.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Supabase null guard | PASS | Shows "Connect Supabase" message |
| Loading skeleton | PASS | Animate-pulse placeholders |
| Stats cards (applications + registrations) | PASS | Renders counts from Supabase |
| Division breakdown bar chart | PASS | All 12 divisions shown, bar width proportional |
| Recent applications list | PASS | Top 5, handles empty state |
| Recent registrations list | PASS | Top 5, handles empty state |
| Coach recommendations banner | PASS | Only shows un-emailed picks, sorted by division |
| Coach picks query correctness | PASS | Filters by `selection_email_sent_at` to exclude already-emailed |

---

## 4. Coach Applications (`/admin/applications`)

**File:** `src/app/admin/applications/page.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Fetch all applications | PASS | Ordered by `submitted_at` descending |
| Status filter pills | PASS | Counts per status, "All" default |
| Expand/collapse detail view | PASS | Toggle via `expandedId` state |
| Status update | PASS | Optimistic local state update after DB write |
| Error handling on status update | PASS | Shows alert with error message |
| Disabled button while updating | PASS | `updatingId` prevents double-clicks |
| Contact info display | PASS | Null check on address |
| Philosophy section | PASS | Conditional render if any field present |
| Null check on `years_coaching` | PASS | Uses `?? "N/A"` |

---

## 5. Announcements (`/admin/announcements`)

**File:** `src/app/admin/announcements/page.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Create announcement | PASS | Validates title and body required |
| Edit mode (inline form reuse) | PASS | Populates form, shows cancel X |
| Delete with confirmation | PASS | Two-step confirm/cancel |
| Success banner after create/edit | PASS | Auto-clears after 4 seconds |
| Division dropdown (optional) | PASS | "All Divisions" default |
| Optimistic state update after edit | PASS | Maps over prev state |
| Optimistic state update after create | PASS | Prepends new item |
| Edited timestamp display | PASS | Shows "(edited ...)" if updated_at != created_at |
| Delete error handling | **WARN** | No error feedback to user if delete fails (silent) |

---

## 6. Teams (`/admin/teams`)

**File:** `src/app/admin/teams/page.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Create team form | PASS | Division, name, coach fields |
| Coach dropdown (accepted only) | PASS | Filters `status === "accepted"` |
| Auto-set division from coach | PASS | Sets `formDivision` when coach selected |
| Coach source toggle (dropdown/manual) | PASS | Switches between dropdown and email input |
| Coach profile lookup by email | PASS | Looks up `profiles` table to set `coach_id` |
| Inline team rename | PASS | Enter to save, Escape to cancel |
| Delete with confirmation | PASS | Two-step yes/no |
| Division filter pills | PASS | Uses `div.split("-")[0]` for short labels |
| Compliance stats per team | PASS | Birth cert, contract, photo counts |
| Tournament Ready badge | PASS | Shows when all players have all 3 docs |
| Coach name display | PASS | Falls back from coach app name to email |
| View Contracts link | PASS | Links to `/coach/contracts?division=...` |

---

## 7. Tryouts (`/admin/tryouts`)

**File:** `src/app/admin/tryouts/page.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Tab switcher (Players / Sessions) | PASS | Clean toggle |
| Division filter (players tab) | PASS | All divisions listed |
| Status filter (players tab) | PASS | All 8 status options |
| Coach Picks filter | PASS | Star icon, count shown |
| Not Picked filter | PASS | Shows count for active division |
| Bulk select / deselect all | PASS | Operates on filtered list only |
| Bulk status update | PASS | Sequential DB updates with progress bar |
| Bulk send emails | PASS | Detailed confirmation dialog with SEND keyword |
| Email sent badges | PASS | Shows "Email Sent" pill for emailed players |
| Acceptance status badges | PASS | Shows "Accepted" or "Awaiting Acceptance" |
| Individual status update | PASS | Disabled if already that status |
| Individual email send | PASS | Confirmation dialog, updates `selection_email_sent_at` |
| Player detail expansion | PASS | Full info: player, parent, emergency, consent, medical |
| Coach recommendation display | **WARN** | Shows raw `coach_id` UUID instead of coach name |
| Create session form | PASS | All required fields validated |
| Edit session | PASS | Re-sends invite emails to already-invited players |
| Delete session | PASS | Deletes assignments first, then session |
| Auto-assign all | PASS | Assigns unassigned players to matching division sessions |
| Assign players modal | PASS | Select all / individual checkboxes |
| Send invites (individual + batch) | PASS | Updates assignment `invited_at`, auto-updates status |
| Session division color bars | PASS | Unique color per division |

---

## 8. Compliance (`/admin/compliance`)

**File:** `src/app/admin/compliance/page.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Overall stats (readiness %, divisions ready, missing) | PASS | Handles zero-player case |
| Division list with progress bars | PASS | Green/amber/red color coding |
| Player checklist (contract, birth cert, photo) | PASS | CheckCircle / XCircle icons |
| Coach certifications section | PASS | Concussion + cardiac arrest checks |
| Coach name display | PASS | Falls back from app name to email |
| Status filter (only selected/confirmed/tryout_complete/alternate) | PASS | Correct `.in()` filter |
| Expand/collapse divisions | PASS | Set-based toggle |
| Divisions with no players but teams | PASS | Shows "No Players Yet" badge |
| Mobile responsive layout | PASS | Single column on mobile, grid on desktop |

---

## 9. Documents (`/admin/documents`)

**File:** `src/app/admin/documents/page.tsx`

| Check | Result | Notes |
|-------|--------|-------|
| Insurance certificate upload | PASS | Global (no division), upsert pattern |
| Insurance certificate view | PASS | Signed URL, 5-minute expiry |
| Tournament rules per division | PASS | Division pill buttons with checkmark for uploaded |
| Tournament rules upload/replace | PASS | Key prop ensures re-render on division change |
| Selected division detail panel | PASS | Shows upload or view+replace |
| Upsert pattern (delete old + insert new) | PASS | Removes storage file + DB row |
| User ID attached to upload | PASS | Reads from `supabase.auth.getUser()` |

---

## BUGS FOUND

### BUG 1: Dashboard links to non-existent `/admin/registrations` route (MEDIUM)

**File:** `src/app/admin/page.tsx`, lines 234-244 and 327-330
**Description:** The "Player Registrations" stat card and "Recent Registrations" section both link to `/admin/registrations`, but no such page exists (`src/app/admin/registrations/` directory does not exist). Clicking these links will result in a 404 page.
**Fix:** Either create the `/admin/registrations` page, or change the links to `/admin/tryouts` (which contains the player list).

### BUG 2: Tryouts page shows raw `coach_id` UUID in coach recommendation section (LOW)

**File:** `src/app/admin/tryouts/page.tsx`, line 1371
**Description:** In the expanded player detail, the "Coach Recommendation" section displays `Coach {selection.coach_id}` which renders a raw UUID like `Coach 3f8a9b2c-...`. The page already has access to `coachSelections` but doesn't join coach names. Should look up the coach name from profiles or coach applications.
**Impact:** Admin sees unhelpful UUID instead of coach name.

### BUG 3: `getPlayerAssignment` returns only the first assignment if player is in multiple sessions (LOW)

**File:** `src/app/admin/tryouts/page.tsx`, line 576
**Description:** `assignments.find()` returns the first match. If a player is assigned to multiple tryout sessions (which the data model allows), only the first session is shown in the player summary row. This could be misleading.
**Fix:** Consider using `filter()` and displaying all sessions, or at minimum showing a count indicator.

### BUG 4: Compliance page `coachCertsByDivision` map overwrites when multiple teams share a division (LOW)

**File:** `src/app/admin/compliance/page.tsx`, lines 185-203
**Description:** The Map uses division as key with `map.set()`. If two teams exist in the same division (e.g., "11U-White" and "11U-Blue"), only the last team's coach info is stored. The first team's coach and certifications are silently dropped.
**Fix:** Use an array per division or a composite key of division + team name.

### BUG 5: `handleViewTeamDoc` has unused `fileName` parameter (TRIVIAL)

**File:** `src/app/admin/documents/page.tsx`, line 102
**Description:** The `fileName` parameter is accepted but never used in the function body. TypeScript won't error on this, but it's dead code.

### BUG 6: Announcements delete has no error feedback (LOW)

**File:** `src/app/admin/announcements/page.tsx`, lines 163-174
**Description:** `handleDelete` silently ignores errors. If the delete fails (e.g., RLS policy, network error), the user sees the confirmation dismiss but the announcement remains. No error message is shown.
**Fix:** Add an error alert or banner similar to the create/edit flow.

### BUG 7: Silent error swallowing in tryout invite emails (LOW)

**File:** `src/app/admin/tryouts/page.tsx`, lines 331-333 and 674
**Description:** Multiple `catch` blocks silently swallow errors (empty catch or `// silent`). If email sending fails, the admin has no way to know. The individual `sendSelectionEmail` catch on line 331 is particularly problematic since the button returns to its normal state with no feedback.
**Fix:** At minimum, show a toast/alert on failure so the admin knows to retry.

### BUG 8: No RLS/auth on admin Supabase queries (MEDIUM-HIGH, by design?)

**File:** All admin pages use the anon key client from `src/lib/supabase.ts`
**Description:** The admin pages query Supabase using the anon key (not a service role key). This means all CRUD operations (status updates, team creation, announcement posting, document uploads) are subject to RLS policies. If RLS policies are too restrictive, admin operations will silently fail. If policies are too permissive, any authenticated user could perform admin actions directly via the Supabase API. The admin layout does a client-side role check, but that only protects the UI, not the data layer.
**Impact:** Depends on how RLS policies are configured. If using permissive policies for the admin role, this is a security concern since any user with the anon key could bypass the client-side role check.

---

## Summary

| Category | Pass | Warn | Fail | Bugs |
|----------|------|------|------|------|
| HTTP Status Codes | 9 | 0 | 0 | 0 |
| Auth & Layout | 6 | 0 | 0 | 0 |
| Dashboard | 8 | 0 | 0 | 1 (dead link) |
| Applications | 9 | 0 | 0 | 0 |
| Announcements | 9 | 1 | 0 | 1 (silent delete error) |
| Teams | 12 | 0 | 0 | 0 |
| Tryouts | 21 | 1 | 0 | 3 (coach ID display, single assignment, silent errors) |
| Compliance | 9 | 0 | 0 | 1 (multi-team overwrite) |
| Documents | 7 | 0 | 0 | 1 (unused param) + 1 (RLS concern) |
| **Total** | **90** | **2** | **0** | **8** |

**Overall: All pages load successfully. 8 bugs found, none critical. The most impactful are the dead `/admin/registrations` link (BUG 1) and the RLS/auth concern (BUG 8).**
