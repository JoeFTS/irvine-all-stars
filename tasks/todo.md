# Irvine All-Stars — Project Roadmap

## Phase 0: Design ✅
- [x] Create 7 HTML design mockups
- [x] Pick final design (Americana: #5 + #7 merged)
- [x] Finalize design system (Oswald + Barlow, flag colors, no gradients)

## Phase 1: Scaffold + Deploy ✅
- [x] Create Next.js 15 project with TypeScript + Tailwind 4
- [x] Configure next.config.ts (standalone output, security headers)
- [x] Create GitHub repo (JoeFTS/irvine-all-stars)
- [x] Deploy to VPS (port 3005, PM2, Nginx)
- [x] Set up DNS (Porkbun → VPS)
- [x] SSL certificate (Let's Encrypt via certbot)
- [x] Implement navbar (responsive, mobile menu)
- [x] Implement footer
- [x] Build homepage (flag hero, divisions, stats, how-it-works, CTA)

## Phase 2: Content Pages + Forms (MVP Launch) ✅
- [x] /coaches page (selection policy, rubric, application process)
- [x] /tryouts page (schedule, scoring, parent info)
- [x] /timeline page (visual 6-phase timeline)
- [x] /faq page (14 questions, accordion component)
- [x] /documents page (downloadable docs grid)
- [x] /updates page (announcements feed)
- [x] Set up Supabase schema (irvine_allstars in ProjectHub)
- [x] /apply/coach — 4-step coach application form
- [x] /apply/player — 3-step player registration form
- [x] Confirmation email API with branded HTML templates
- [x] Resend email integration
- [x] Division names corrected (9U-Mustang, 12U-Bronco)
- [x] /portal placeholder page
- [x] Add RESEND_API_KEY to VPS .env.local
- [x] Duplicate registration prevention
- [x] Multi-child registration flow ("Register Another Child")

## Phase 3: Auth + Evaluator Scoring ✅
- [x] Auth context with role-based access (admin/coach/evaluator/parent)
- [x] Profiles table in Supabase
- [x] Login page (/auth/login)
- [x] Signup page (/auth/signup)
- [x] Auth callback for email confirmation
- [x] Middleware protecting /admin, /portal, /evaluate routes
- [x] Evaluator setup page (/evaluate) — name, division, session ID
- [x] Evaluator scoring sheet (/evaluate/score) — mobile-first, 56px touch targets
- [x] Auto-save with 500ms debounce + localStorage offline buffer
- [x] Session summary (/evaluate/summary) — rankings, score breakdowns, edit links

## Phase 4: Admin Dashboard ✅
- [x] Admin layout with sidebar (desktop) / bottom tabs (mobile)
- [x] Dashboard overview with stat cards + recent submissions
- [x] Coach applications — filter by status, expand details, update status
- [x] Player registrations — filter by division/status, expand, update
- [x] Evaluator scores — grouped by division, sorted by total, expandable
- [x] Announcements CRUD — create, edit, delete, division targeting

## Phase 5: Parent + Coach Portals ✅
- [x] Auth-gated parent portal (/portal)
- [x] Player status cards with color-coded badges
- [x] Division-filtered announcements feed
- [x] Quick links grid + key dates section
- [x] Step-by-step compliance gating (Register → Contract → Photo → Birth Cert)
- [x] Contract page gated behind team selection
- [x] Documents page gated behind signed contract
- [x] Coach portal (/coach) with dashboard, roster, checklist, certifications, tournament rules, updates
- [x] Coach roster only shows players with signed contracts
- [x] Admin account set up (allstars@irvinepony.com)

## Phase 6: Final Polish (MUST FINISH BY 2026-03-17)

### Priority 1 — Must Have
- [x] Full e2e production test: register player → admin selects → parent signs contract → uploads docs → coach sees on roster — ALL PASS, emails sent to bloodkin@me.com ✅
- [x] Verify confirmation emails actually send in production (Resend) — API returns success, Resend domain verified, RESEND_API_KEY on VPS ✅
- [x] Admin: ability to bulk-select players for teams (set status to "selected") — checkboxes, select-all, bulk action bar with progress ✅
- [x] Admin: send "You've been selected" notification email to parents when status changes — already existed in single-update; now also fires in bulk flow ✅
- [x] Verify all Supabase tables exist (teams, player_documents, player_contracts, coach_certifications, etc.) — all 13 tables verified with row counts ✅
- [x] Verify Supabase Storage bucket "player-documents" exists and RLS policies allow parent uploads — bucket created + 3 RLS policies added ✅

### Priority 2 — Should Have
- [x] Admin: view uploaded documents per player (birth certs, photos) — `/admin/documents` with view/download/approve/reject ✅
- [x] Admin: team compliance overview (which teams are tournament-ready) — `/admin/compliance` with per-division/per-player drill-down ✅
- [x] Bug fix: `document_type` mismatch — teams page checked "photo" but portal uploads "player_photo" ✅
- [ ] Homepage: replace placeholder content with real images (deferred — no real team photos available yet)
- [x] SEO: meta tags + OG images for all pages ✅
- [x] Mobile polish pass on all pages ✅
- [x] Coach tryouts page — coaches see division players, scores, and submit recommendations ✅
- [x] Admin tryouts — coach picks integration (gold badge + filter) ✅
- [x] Database: coach_selections table + RLS policies ✅

### Priority 3 — Nice to Have
- [ ] Analytics (GA4 or Plausible)
- [ ] Practice Schedule Board
- [ ] Tournament Hub
- [ ] Photo Gallery

---
**Status:** Phases 0-5 COMPLETE. 22+ routes live at irvineallstars.com. 43/43 e2e tests passing.
**Deadline:** March 17, 2026
**Last Updated:** 2026-03-16
