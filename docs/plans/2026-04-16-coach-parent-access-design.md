# Coach Parent-Portal Access — Design

**Date:** 2026-04-16
**Status:** Approved

## Goal

When an admin sends a coach invite, the coach (after signup) should also have access to the Parent Portal and be able to self-register their own child for tryouts — instead of the admin pre-populating child details.

## Current State

- `coach` role profiles already get "Parent Portal" link in navbar (see [navbar.tsx:112](src/components/navbar.tsx)).
- `/portal` page queries registrations by `parent_email` OR `secondary_parent_email` — no role gate. Coach with no linked registration sees an empty state message.
- `/api/send-invite` coach path already supports optional children via `coachIsParent` toggle on admin form. Keep as-is for backward compat.
- Coach dashboard already has a "Parent" quick-link to `/portal` (see [coach/page.tsx:75](src/app/coach/page.tsx)).
- `/apply/player` accepts query prefill (`parent_name`, `parent_email`, etc.) — pattern used today at [portal/page.tsx:579](src/app/portal/page.tsx).

## Scope (additive only — no breaking changes)

1. **Coach invite email copy** ([send-invite/route.ts](src/app/api/send-invite/route.ts))
   - Add bullet "Parent Portal — register your own player" to the feature list.
   - Add paragraph: "As a coach, you also have access to the Parent Portal. If your own child is trying out, you can register them there after you set up your account."
   - Preserve existing `childMention` branch used when admin pre-attaches children.

2. **Parent portal empty state** ([portal/page.tsx](src/app/portal/page.tsx) ~line 568)
   - Replace plain "No tryout registrations found" with a card:
     - Headline "Register Your Player"
     - Body copy
     - CTA linking to `/apply/player?parent_email=<user.email>&parent_name=<profile.full_name>`
   - Shows for any authed user with zero registrations (coach or parent alike — benign).

3. **Admin invite form micro-copy** ([admin/invites/page.tsx](src/app/admin/invites/page.tsx))
   - Change `coachIsParent` toggle label/helper to clarify it is optional and coach can self-register.

## Non-goals

- No DB schema changes.
- No auth/role changes.
- No change to `/api/send-invite` request/response shape.
- No change to `/api/complete-signup` logic.
- No coach dashboard banner (quick-link already exists).

## Backwards compatibility

- All existing flows preserved:
  - Admin sends coach invite WITH children → unchanged behavior, email still mentions children.
  - Admin sends coach invite WITHOUT children → now mentions self-register path in email.
  - Admin sends parent invite → unchanged.
  - Parent users with registrations → unchanged (empty-state card only triggers when list is zero).
  - Existing coach users with no linked registration → now see CTA instead of "no registrations" message.

## Files Modified

- `src/app/api/send-invite/route.ts` — email HTML only
- `src/app/portal/page.tsx` — empty-state JSX only
- `src/app/admin/invites/page.tsx` — label/helper copy only

## Testing

- Manual: Admin sends coach invite (no children). Verify email mentions parent portal. Coach signs up, visits `/portal`, sees CTA. Clicks CTA → lands on `/apply/player` with email/name prefilled. Submits form, returns to `/portal`, registration appears.
- Manual: Admin sends coach invite WITH children (toggle on). Verify email still mentions children AND parent portal access. Coach signs up, sees pre-registered children on `/portal`.
- Manual: Admin sends parent invite. Verify email unchanged from existing behavior.
