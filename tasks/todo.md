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

## Phase 2: Content Pages + Coach Application (MVP Launch) 🔄
- [x] /coaches page (selection policy, rubric, application process)
- [x] /tryouts page (schedule, scoring, parent info)
- [x] /timeline page (visual 6-phase timeline)
- [x] /faq page (14 questions, accordion component)
- [x] /documents page (downloadable docs grid)
- [x] /updates page (announcements feed)
- [ ] Set up Supabase schema (irvine_allstars in ProjectHub)
- [ ] /apply/coach — Coach Application Form (multi-step wizard)
- [ ] /apply/player — Player/Family Tryout Registration Form
- [ ] Deploy MVP with forms live
- [ ] Verify forms submit to Supabase correctly

## Phase 3: Auth + Evaluator Scoring
- [ ] Supabase auth (email + password)
- [ ] Profiles table with roles (admin, coach, evaluator, parent)
- [ ] Login page (/auth/login)
- [ ] Auth middleware for protected routes
- [ ] Evaluator Scoring Sheet (/evaluate/[sessionId]) — mobile-first, tablet-optimized
- [ ] Auto-save scores to Supabase
- [ ] "Next Player" flow for quick scoring

## Phase 4: Admin Dashboard
- [ ] /admin — Dashboard overview
- [ ] View/filter coach applications by status
- [ ] View player registrations by division
- [ ] Create/manage tryout sessions
- [ ] View aggregated evaluator scores
- [ ] Post announcements
- [ ] Manage timeline events

## Phase 5: Parent Portal
- [ ] /portal — Parent portal home (auth-gated)
- [ ] View child's registration status
- [ ] Access division-specific documents
- [ ] View announcements (filtered by division)
- [ ] RSVP to events
- [ ] Email notifications on status changes

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

---
**Current Focus:** Phase 2 — Supabase schema + coach/player forms
**Last Updated:** 2026-03-13
