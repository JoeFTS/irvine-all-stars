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
- [x] Evaluator scoring sheet (/evaluate/score) — mobile-first, 1-9 scale, 6 categories
- [x] Auto-save with 500ms debounce + localStorage offline buffer
- [x] Session summary (/evaluate/summary) — rankings, score breakdowns, edit links

## Phase 4: Admin Dashboard ✅
- [x] Admin layout with sidebar (desktop) / scrollable bottom tabs (mobile)
- [x] Dashboard overview with stat cards + recent submissions
- [x] Coach applications — filter by status, expand details, update status
- [x] Player registrations — filter by division/status, expand, update
- [x] Evaluator scores — grouped by division, sorted by total, expandable (/9 scale, /54 total)
- [x] Announcements CRUD — create, edit, delete, division targeting
- [x] Admin documents viewer (/admin/documents) — view/download/approve/reject
- [x] Admin compliance page (/admin/compliance) — tournament readiness per division
- [x] Admin tryouts — coach picks integration (gold badge + filter)
- [x] Status updates separated from email sending (no accidental emails)

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
- [x] Coach tryouts page (/coach/tryouts) — view division players + scores + submit recommendations
- [x] Coach score entry (/coach/scores) — download template, fill in, upload (3-step flow)
- [x] Coach recommendations with remove button
- [x] Coach application auto-accepted when invite is sent

## Phase 6: Final Polish ✅
- [x] Full e2e production test — ALL PASS ✅
- [x] Verify confirmation emails (Resend) ✅
- [x] Admin bulk-select with progress bar ✅
- [x] Supabase Storage bucket + RLS ✅
- [x] SEO: OpenGraph metadata on all pages ✅
- [x] Mobile polish pass (touch targets, overflow, responsive) ✅
- [x] Scoring system overhaul: 6 categories, 1-9 scale, max 54 ✅
- [x] Replaced broken emoji HTML entities with SVG icons ✅
- [x] Coach application error visibility improved ✅
- [x] Teams table: added coach_email column ✅
- [ ] Homepage: replace placeholder content with real images (deferred — no photos yet)

## Phase 7: Nice to Have
- [ ] Analytics (GA4 or Plausible)
- [ ] Practice Schedule Board
- [ ] Tournament Hub
- [ ] Photo Gallery
- [ ] Clean up test data (joe@fivetoolsolutions.com coach application)

---
**Status:** Phases 0-6 COMPLETE. 26+ routes live at irvineallstars.com.
**Last Updated:** 2026-03-17
