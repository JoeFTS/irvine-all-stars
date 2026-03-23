# 10 — Known Issues & Bugs Found During Testing

**Date:** 2026-03-22
**Status:** Bugs categorized by severity, fixed items marked.

---

## FIXED During This Session

| Bug | Location | Description | Fix |
|-----|----------|-------------|-----|
| Coach dashboard cert mismatch | `coach/page.tsx` | Queried `certification_type` column which doesn't exist (actual: `cert_type`). Certs always showed as incomplete. | Fixed: renamed to `cert_type` |
| Assistant coach View/Print | `coach/certifications/page.tsx` | Uploaded assistant coach certs had no View/Print button. | Fixed: added View/Print buttons |
| Evaluator max score display | `evaluate/summary/page.tsx` | Showed `/ 30` but actual max is 54 (6 categories x 9). | Fixed: changed to `/ 54` |

---

## HIGH Severity (Security)

| ID | Location | Description | Recommendation |
|----|----------|-------------|----------------|
| SEC-01 | `/api/medical-release-sheet/route.ts` | No authentication. Anyone can download player rosters by division via `GET ?division=12U-Bronco`. | Add auth middleware — require admin or coach role |
| SEC-02 | `/api/send-selection/route.ts` | No authentication. Anyone can POST to send emails from the All-Stars address to arbitrary recipients. Potential phishing vector. | Add admin auth check |
| SEC-03 | `/api/score-sheet/route.ts` | No authentication. Player names, positions, jersey numbers exposed publicly. | Add admin/coach auth check |
| SEC-04 | `/evaluate/` pages | Zero authentication on evaluator flow. Anyone can submit scores to the database. | Add evaluator invite/token system |

---

## MEDIUM Severity (Functional)

| ID | Location | Description | Recommendation |
|----|----------|-------------|----------------|
| MED-01 | `/contract-view/page.tsx` | Any authenticated user can view any contract — no ownership/role check. | Add parent email filter or role check |
| MED-02 | `/medical-view/page.tsx` | Any authenticated user can view any player's medical data (allergies, medications, insurance). Sensitive PII. | Add ownership check |
| MED-03 | `/portal/medical-release/page.tsx` | All medical form fields except checkbox+signature are optional. A parent can submit an entirely empty medical release. | Consider requiring insurance info or confirmation prompt |
| MED-04 | `/portal/confirm/page.tsx` | No ownership verification on tryout confirmation. Any UUID holder can confirm. Low practical risk but no auth. | Add parent email verification |

---

## LOW Severity (UX/Minor)

| ID | Location | Description |
|----|----------|-------------|
| LOW-01 | `/portal/page.tsx` | "Decline" button shows alert to email manually — no actual backend action |
| LOW-02 | `/portal/medical-release/page.tsx` | Auth redirect goes to `/portal` instead of `/portal/medical-release` — user loses context |
| LOW-03 | `/portal/medical-release/page.tsx` | Misleading error message when unauthorized user tries to access another player's form |
| LOW-04 | `/coach/checklist/page.tsx` | Checklist fetches ALL registrations without filtering by coach's division — each coach sees all players |

---

## Summary

- **43/43 routes** return HTTP 200 (or expected 404)
- **4/4 API routes** handle errors properly (400, not 500)
- **3 bugs fixed** during this testing session
- **4 HIGH severity** security items (unauthenticated API routes)
- **4 MEDIUM severity** items (access control, form validation)
- **4 LOW severity** items (UX polish)
