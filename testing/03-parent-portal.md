# Test Report: Parent Portal & Related Pages

**Date:** 2026-03-22
**Tester:** Claude (automated)
**Environment:** Production (https://irvineallstars.com)

---

## 1. HTTP Status Code Tests

| # | URL | Expected | Actual | Result |
|---|-----|----------|--------|--------|
| 1 | `/portal` | 200 | 200 | PASS |
| 2 | `/portal/confirm` | 200 | 200 | PASS |
| 3 | `/portal/contract` | 200 | 200 | PASS |
| 4 | `/portal/documents` | 200 | 200 | PASS |
| 5 | `/portal/medical-release` | 200 | 200 | PASS |
| 6 | `/contract-view` | 200 | 200 | PASS |
| 7 | `/medical-view` | 200 | 200 | PASS |
| 8 | `/evaluate` | 200 | 200 | PASS |
| 9 | `/evaluate/score` | 200 | 200 | PASS |
| 10 | `/evaluate/summary` | 200 | 200 | PASS |

**All pages serve without server errors.**

---

## 2. API Route Tests

| # | Route | Method | Expected | Actual Status | Response Body | Result |
|---|-------|--------|----------|---------------|---------------|--------|
| 11 | `/api/medical-release-sheet` | GET | 400 (missing param) | 400 | `{"error":"Missing division parameter"}` | PASS |
| 12 | `/api/score-sheet` | GET | 400 (missing param) | 400 | `{"error":"Missing parameters"}` | PASS |
| 13 | `/api/send-selection` | GET | 405 (wrong method) | 405 | (empty body) | PASS |

**All API routes return proper error responses, no 500s.**

---

## 3. Code Review

### 3.1 `/portal/page.tsx` -- Parent Dashboard

**Auth:** PASS -- Redirects to `/auth/login?redirect=/portal` when not authenticated. Renders a "Sign In Required" card for unauthenticated users rather than returning null.

**Data fetching:** PASS -- Queries `tryout_registrations` by parent email (primary + secondary). Fetches documents, contracts, tryout assignments, and announcements in parallel.

**Null checks:** PASS -- Uses `(regs ?? [])`, `(docsResult.data ?? [])`, etc. throughout. Player name fallback to "Unknown Player".

**Selection acceptance flow:** PASS -- `acceptSelection()` validates `supabase`, `user`, and `reg` before proceeding. Inserts into `player_documents` with `document_type: "selection_acceptance"`. Error handling via `alert()`.

**Compliance checklist logic:** PASS -- Correct sequential gating: selection acceptance -> contract -> documents/medical. Items are locked/unlocked based on prior step completion.

**Issues found:**
- **BUG-01 (Minor):** `player_name` field is in the `Registration` interface (line 20) but the `select()` query (line 217-219) does not fetch `player_name`. The field is never used in rendering (name is built from `player_first_name`/`player_last_name`), so no runtime error, but the interface is misleading.
- **BUG-02 (Low):** `useEffect` dependency arrays for data fetching (line 290) only include `[user]` -- missing `supabase` in deps. Not a practical bug since `supabase` is a module-level constant, but ESLint may warn.
- **BUG-03 (Low):** The "Decline" button (line 740-746) shows `confirm()` then `alert()` -- there is no actual backend decline action. The user is told to email manually. This is functional but may confuse users who expect the button to do something.

---

### 3.2 `/portal/confirm/page.tsx` -- Tryout Confirmation

**Purpose:** Confirms tryout attendance via link with `?id=<registration_id>`. Posts to `/api/confirm-tryout`.

**Auth:** N/A -- This page does NOT require auth. It's a public link sent via email. This is intentional (parents click a link to confirm attendance).

**Null checks:** PASS -- Checks `registrationId` before calling API. Handles `error`, `already`, and `success` states.

**Suspense:** PASS -- Properly wraps `useSearchParams()` in Suspense boundary.

**Issues found:**
- **BUG-04 (Medium):** No rate limiting or authentication on the confirm flow. Anyone with a registration UUID can confirm attendance. The `/api/confirm-tryout` route accepts any `registration_id` without verifying the caller owns it. Low practical risk since UUIDs are hard to guess, but worth noting.

---

### 3.3 `/portal/contract/page.tsx` -- Contract Signing

**Auth:** PASS -- Redirects to `/auth/login?redirect=/portal/contract` when not authenticated. Returns `null` if no user (after redirect fires).

**Data fetching:** PASS -- Filters registrations to `status === "selected" || status === "alternate"`. Fetches existing contracts to detect already-signed state.

**Form validation:** PASS -- All acknowledgment checkboxes must be checked (`allChecked`), and signature must be non-empty. Submit button disabled via `canSubmit`.

**Contract insert:** PASS -- Maps `checks[0]` through `checks[6]` to individual `acknowledge_*` boolean columns. Includes `signed_at` timestamp.

**Null checks:** PASS -- Checks `!canSubmit || !supabase || !user || !selectedReg` in submit handler.

**Issues found:**
- **BUG-05 (Low):** `useEffect` for data fetching (line 120) has `[user]` but also reads `playerParam` from `useSearchParams()` -- `playerParam` is not in the dependency array. Since `playerParam` is read from URL and doesn't change, this is not a practical issue.

---

### 3.4 `/portal/documents/page.tsx` -- Document Uploads

**Auth:** PASS -- Redirects to login when not authenticated.

**Gating logic:** PASS -- Only shows players who have signed contracts (filters by `signedRegIds`). Shows "Not Yet Available" message with link back to portal if no eligible players.

**Upload handling:** PASS -- `handleUploadComplete` inserts into `player_documents` with correct fields. Replaces existing doc of same type in local state (deduplication).

**Null checks:** PASS -- Guards on `!supabase || !user` in upload handler.

**Issues found:** None significant.

---

### 3.5 `/portal/medical-release/page.tsx` -- Medical Release Form

**Auth:** PASS -- Redirects to `/auth/login?redirect=/portal` when not authenticated.

**Player selection:** Uses `window.location.search` instead of `useSearchParams()` to avoid Suspense requirement. Reads `?player=` param.

**Form validation:** PASS -- Validates `authorize_treatment` checkbox and `parent_signature` are filled.

**Data storage:** The medical release data is stored as JSON in the `file_name` column of `player_documents`. This is a workaround pattern (no dedicated `medical_releases` table).

**Null checks:** PASS -- Guards on `!supabase || !registration || !user` in submit handler.

**Issues found:**
- **BUG-06 (Medium):** Medical form fields (allergies, medications, insurance_provider, insurance_policy_number, physician_name, physician_phone) are all optional with no validation. A parent can submit an entirely empty medical release with just the checkbox and signature. Consider requiring at least insurance info or showing a confirmation if fields are blank.
- **BUG-07 (Low):** The auth redirect goes to `/portal` instead of `/portal/medical-release` (line 65). After login, the user would land on the portal dashboard rather than being returned to the medical release form with their player param.
- **BUG-08 (Low):** No check that the registration belongs to the logged-in user's family is enforced client-side before showing the form. The Supabase query does filter by `parent_email` (line 85-87), so unauthorized access would result in no data -- but the error message ("No player selected") is misleading in that case.

---

### 3.6 `/contract-view/page.tsx` -- Contract Viewer

**Auth:** PASS -- Shows error message if not logged in (does not redirect, which is appropriate for a viewer).

**Authorization gap:**
- **BUG-09 (Medium):** No authorization check on WHO can view a contract. Any authenticated user can view any contract by guessing/knowing a `registration_id`. The query (line 54-58) has no `.eq("parent_email", user.email)` filter. The `role` is destructured from `useAuth()` (line 29) but never used. A coach or admin viewing contracts may be intentional, but any random authenticated user can also view them.

**Null checks:** PASS -- Handles missing `id` param, fetch errors, and null contract.

---

### 3.7 `/medical-view/page.tsx` -- Medical Release Viewer

**Auth:** PASS -- Shows error message if not logged in.

**Authorization gap:**
- **BUG-10 (Medium):** Same issue as contract-view. Any authenticated user can view any player's medical release by providing a `registration_id`. Medical data (allergies, medications, insurance) is particularly sensitive.

**Data parsing:** PASS -- Parses JSON from `file_name` field with try/catch.

---

### 3.8 `/api/medical-release-sheet/route.ts` -- Excel Sheet Generation

**Parameter validation:** PASS -- Returns 400 if `division` is missing.

**Auth:** FAIL -- **BUG-11 (High):** No authentication check. Anyone can download a medical release Excel sheet for any division by hitting `/api/medical-release-sheet?division=12U-Bronco`. This sheet contains player names. While it's a printable form (blank signature columns), the player roster is sensitive information.

**Error handling:** PASS -- Checks Supabase config, returns 500 if missing.

**Query logic:** Fetches all contracts, then filters players by `selected`/`alternate` status AND having a signed contract. Correct.

---

### 3.9 `/api/send-selection/route.ts` -- Selection Email Sending

**Method:** Only `POST` exported. GET correctly returns 405.

**Parameter validation:** PASS -- Validates all 6 required fields. Validates `status` is one of the 3 allowed values.

**Auth:** FAIL -- **BUG-12 (High):** No authentication or authorization check. Anyone who can POST to this endpoint can send selection emails to arbitrary email addresses on behalf of "Irvine All-Stars". This could be used for phishing or spam. Should require admin auth.

**Email content:** PASS -- Three well-crafted email templates for selected, not_selected, and alternate statuses. Uses Resend API with proper error handling.

**Fallback:** PASS -- If `RESEND_API_KEY` is not set, logs warning and returns success (doesn't crash).

---

### 3.10 `/api/score-sheet/route.ts` -- Score Sheet Excel Generation

**Parameter validation:** PASS -- Returns 400 if neither `session_id`, `division`, nor `blank` is provided.

**Auth:** FAIL -- **BUG-13 (High):** No authentication check. Anyone can download player rosters (names, positions, teams, jersey numbers) by hitting `/api/score-sheet?division=12U-Bronco`.

**Excel generation:** PASS -- Well-structured with proper formatting, SUM formulas, print settings.

---

### 3.11 `/evaluate/page.tsx` -- Evaluator Landing

**Auth:** None -- evaluator setup is open to anyone who visits the URL. Evaluator info is stored in `sessionStorage` only.

**Validation:** PASS -- Requires name, division, and session ID before proceeding.

**Issues found:**
- **BUG-14 (Medium):** No authentication whatsoever on the evaluator flow. Anyone can access `/evaluate`, enter a name, and start scoring players. Scores go directly into the `evaluator_scores` table in Supabase. The Supabase anon key has insert permissions on this table.

---

### 3.12 `/evaluate/score/page.tsx` -- Score Entry

**Session guard:** PASS -- Redirects to `/evaluate` if no evaluator info in `sessionStorage`.

**Auto-save:** PASS -- Debounced save to Supabase (500ms), localStorage persistence, periodic retry every 10s for unsynced scores.

**Offline resilience:** PASS -- Saves to `localStorage` immediately, syncs when online.

**Issues found:**
- **BUG-15 (Low):** Summary page shows "/ 30" as max score (line 229 of summary) but score page shows "/ 54" (line 351 of score page). The actual max is 54 (6 categories x 9 points each). The summary page has a display error showing "/ 30" instead of "/ 54".

---

## 4. BUGS FOUND

### High Priority

| ID | Location | Description |
|----|----------|-------------|
| BUG-11 | `/api/medical-release-sheet/route.ts` | **No auth on medical release sheet download.** Anyone can download player rosters by division. Should require admin/coach authentication. |
| BUG-12 | `/api/send-selection/route.ts` | **No auth on selection email sending.** Anyone can POST to send emails from the All-Stars address to arbitrary recipients. Should require admin auth. |
| BUG-13 | `/api/score-sheet/route.ts` | **No auth on score sheet download.** Player names, positions, teams, jersey numbers exposed publicly by division. Should require admin/coach auth. |

### Medium Priority

| ID | Location | Description |
|----|----------|-------------|
| BUG-04 | `/portal/confirm/page.tsx` + `/api/confirm-tryout/route.ts` | No ownership verification on tryout confirmation. Any UUID holder can confirm. Low practical risk but no auth check. |
| BUG-06 | `/portal/medical-release/page.tsx` | All medical form fields except checkbox+signature are optional. Parent can submit an empty medical release. |
| BUG-09 | `/contract-view/page.tsx` | Any authenticated user can view any contract. No ownership/role check. |
| BUG-10 | `/medical-view/page.tsx` | Any authenticated user can view any player's medical data (allergies, medications, insurance). No ownership/role check. Sensitive PII. |
| BUG-14 | `/evaluate/page.tsx` | Evaluator flow has zero authentication. Anyone can submit scores to the database. |

### Low Priority

| ID | Location | Description |
|----|----------|-------------|
| BUG-01 | `/portal/page.tsx` | `player_name` in Registration interface but not fetched from DB. Unused but misleading. |
| BUG-02 | `/portal/page.tsx` | Data fetch `useEffect` missing `supabase` in dependency array. |
| BUG-03 | `/portal/page.tsx` | "Decline" button shows alert to email manually -- no actual backend action. |
| BUG-05 | `/portal/contract/page.tsx` | `playerParam` read in `useEffect` but not in dependency array. |
| BUG-07 | `/portal/medical-release/page.tsx` | Auth redirect goes to `/portal` instead of `/portal/medical-release` -- user loses context after login. |
| BUG-08 | `/portal/medical-release/page.tsx` | Misleading error message when unauthorized user tries to access another player's form. |
| BUG-15 | `/evaluate/summary/page.tsx` | Shows "/ 30" as max score but actual max is 54 (6 categories x 9). Display error. |

---

## 5. Summary

**Pages tested:** 10/10 all return HTTP 200
**API routes tested:** 3/3 all return proper error codes (400/405), no 500s
**Total bugs found:** 15 (3 high, 5 medium, 7 low)

**Critical theme:** The three API routes (`medical-release-sheet`, `score-sheet`, `send-selection`) have **no authentication at all**. This is the highest-priority fix needed -- these endpoints expose player PII and allow sending emails without authorization.

**Secondary theme:** The viewer pages (`contract-view`, `medical-view`) and the evaluator flow lack proper authorization checks. Any authenticated user can access any player's data.

**What's working well:**
- All parent portal pages have proper auth guards with login redirects
- Form validation on contract signing is thorough (all checkboxes + signature required)
- Document upload gating (contract must be signed first) is correctly implemented
- Compliance checklist in the portal dashboard correctly sequences steps
- API routes return clean error responses with appropriate HTTP status codes
- Evaluator scoring has good offline resilience with localStorage + periodic sync
- Email templates are professionally crafted with all three selection states covered
