# 10 — Known Issues & Bugs Found During Testing

**Date:** 2026-03-22
**Last Updated:** 2026-03-23

---

## ALL HIGH & MEDIUM Issues — FIXED

### Fixed: Session March 22-23

| Bug | Location | Description | Status |
|-----|----------|-------------|--------|
| Coach dashboard cert mismatch | `coach/page.tsx` | Queried `certification_type` (doesn't exist), actual column is `cert_type`. Certs always showed incomplete. | FIXED |
| Assistant coach View/Print | `coach/certifications/page.tsx` | Uploaded assistant coach certs had no View/Print button. | FIXED |
| Evaluator max score display | `evaluate/summary/page.tsx` | Showed `/ 30` but actual max is 54 (6 x 9). | FIXED |
| Admin dashboard broken link | `admin/page.tsx` | `/admin/registrations` (404) should be `/admin/tryouts`. | FIXED |
| API: medical-release-sheet | `api/medical-release-sheet/route.ts` | No auth — anyone could download player rosters. | FIXED: requires admin/coach auth |
| API: score-sheet | `api/score-sheet/route.ts` | No auth — player names, positions, jersey numbers exposed. | FIXED: requires admin/coach auth |
| API: send-selection | `api/send-selection/route.ts` | No auth — anyone could send emails from All-Stars address. | FIXED: requires admin-only auth |
| Contract view access | `contract-view/page.tsx` | Any authenticated user could view any contract. | FIXED: parents only see their own |
| Medical view access | `medical-view/page.tsx` | Any authenticated user could view any player's medical data. | FIXED: parents only see their own |
| Coach checklist filter | `coach/checklist/page.tsx` | Showed ALL divisions instead of coach's assigned division. | FIXED: filters by coach's team division |
| Coach apps permission | DB: `coach_applications` | Authenticated users couldn't update (missing UPDATE grant). | FIXED: added grants |
| Team docs permission | DB: `team_documents` | Coaches couldn't upload (missing INSERT grant). | FIXED: added grants |
| Cert column names | `coach/certifications/page.tsx` | Code used `file_path`/`file_name` but DB has `cert_file_path`/`cert_file_name`. | FIXED |
| Selection email persistence | `admin/tryouts/page.tsx` | Email sent status was client-side only, lost on refresh. | FIXED: persisted to DB |

---

## Remaining LOW Severity (UX/Polish)

| ID | Location | Description | Priority |
|----|----------|-------------|----------|
| LOW-01 | `/portal/page.tsx` | "Decline" button shows alert to email manually — no backend action | Low |
| LOW-02 | `/portal/medical-release/page.tsx` | Auth redirect goes to `/portal` instead of back to medical-release | Low |
| LOW-03 | `/portal/medical-release/page.tsx` | All medical form fields optional — parent can submit empty form | Low |
| LOW-04 | `/evaluate/` | Evaluator flow has no authentication (anyone can submit scores) | Medium — consider adding invite tokens |

---

## Test Results Summary

- **47/47 automated tests pass** (43 routes + 4 API checks)
- **Re-run:** `node testing/run-tests.mjs`
- **14 bugs fixed** across this session
- **4 remaining items** (all low priority UX polish)
