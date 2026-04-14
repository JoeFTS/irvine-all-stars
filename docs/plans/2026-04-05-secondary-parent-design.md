# Secondary Parent/Guardian Feature Design

**Date:** 2026-04-05
**Goal:** Let a second parent/guardian access the parent portal with full equal access, so both parents stay informed about their child's registration, documents, and status.

## Core Scenario

Mom registers the player. Dad wants to see the dashboard, check status, upload documents, and sign contracts too. The second parent gets full equal access — same as the primary.

## Database Changes

No new tables. Add two columns to `tryout_registrations`:

- `secondary_parent_name` (text, nullable)
- `secondary_parent_phone` (text, nullable)

The existing `secondary_parent_email` column stays as-is. Together these three fields mirror the primary parent fields (`parent_name`, `parent_email`, `parent_phone`).

## Registration Form Changes

In `PlayerRegistrationForm` Step 1 (Parent & Player Info), add an optional "Second Parent/Guardian" group below the primary parent fields:

- Collapsible section revealed by an "Add a second parent/guardian" link
- Three optional fields: Name, Email (existing `secondary_parent_email`), Phone
- Phone formatted like primary parent `(XXX) XXX-XXXX`
- All fields optional — any combination is valid
- If email is provided, that parent gets portal access via existing `.or()` query

## Parent Portal — Manage Second Parent

A "Second Parent/Guardian" card on the dashboard for each player registration:

- **No second parent:** Shows "Add Second Parent" button
- **Second parent exists:** Shows name, email, phone with Edit icon
- Add/Edit opens inline form or modal with three fields
- Saves directly to `tryout_registrations` via Supabase update
- Both primary and secondary parent can edit (full equal access)
- No delete action — clear fields to remove

## Coach Roster Visibility

On `/coach/roster/page.tsx`, add a "Second Parent/Guardian" section between the existing "Parent Contact" and "Emergency Contact" sections:

- Shows name, email (mailto link), phone (tel link)
- Only renders if any of the three fields are populated

## Admin Visibility

No special admin work. The new columns show up wherever `secondary_parent_email` is already queried. Admin registration detail views include the new fields.

## Out of Scope

- No welcome/notification email to the second parent (they sign in directly)
- No changes to email sending (tryout invites, selections go to primary only)
- No changes to auth flow, medical release, or emergency contacts
- Adding second parent to notification emails is a future feature
