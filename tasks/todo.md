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
- [ ] Add RESEND_API_KEY to VPS .env.local (Joe needs to create Resend account)
- [ ] Test full e2e form submission on production

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

## Phase 5: Parent Portal ✅
- [x] Auth-gated parent portal (/portal)
- [x] Player status cards with color-coded badges
- [x] Division-filtered announcements feed
- [x] Quick links grid (tryouts, scoring, FAQ, documents, contact)
- [x] Key dates section

## Phase 6: Polish + Future
- [ ] Generate real images with imagegen skill (hero, division graphics)
- [ ] SEO optimization (meta tags, OG images)
- [ ] Analytics (GA4 or Plausible)
- [ ] Practice Schedule Board
- [ ] Volunteer Sign-Up
- [ ] Equipment/Uniform Tracker
- [ ] Tournament Hub
- [ ] Photo Gallery
- [ ] Post-Season Survey
- [ ] Set up Joe's admin account in Supabase

---
**Status:** Phases 0-5 COMPLETE. 22 routes live at irvineallstars.com.
**Remaining:** Phase 6 polish items + Resend API key setup + admin account creation
**Last Updated:** 2026-03-14
