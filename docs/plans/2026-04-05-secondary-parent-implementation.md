# Secondary Parent/Guardian Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let a second parent/guardian access the parent portal with full equal access, so both parents can view status, upload documents, and sign contracts.

**Architecture:** Add `secondary_parent_name` and `secondary_parent_phone` columns to the existing `tryout_registrations` table (the `secondary_parent_email` column already exists). Add optional fields to the registration form, a management card on the portal dashboard, and display on the coach roster.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres via Management API), React, Tailwind CSS, Lucide icons.

---

### Task 1: Add Database Columns

Add two nullable text columns to `tryout_registrations` via the Supabase Management API.

**Step 1: Run SQL to add columns**

Use the Supabase Management API (see `memory/supabase_admin.md` for keys/endpoints). Execute:

```sql
ALTER TABLE tryout_registrations
ADD COLUMN IF NOT EXISTS secondary_parent_name text,
ADD COLUMN IF NOT EXISTS secondary_parent_phone text;
```

**Step 2: Verify columns exist**

Run a verification query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tryout_registrations'
AND column_name IN ('secondary_parent_name', 'secondary_parent_phone', 'secondary_parent_email');
```

Expected: All three columns present, type `text`, nullable `YES`.

---

### Task 2: Registration Form — Add Second Parent Fields

**Files:**
- Modify: `src/components/player-registration-form.tsx`

**Step 1: Add form fields to FormData interface and INITIAL_DATA**

Add to the `FormData` interface (around line 48) in the Step 1 group:

```typescript
secondary_parent_name: string;
secondary_parent_email: string;
secondary_parent_phone: string;
```

Add to `INITIAL_DATA` (around line 73):

```typescript
secondary_parent_name: "",
secondary_parent_email: "",
secondary_parent_phone: "",
```

**Step 2: Add the collapsible second parent section to Step 1 UI**

After the parent email/phone grid (after line 639, after the closing `</div>` of the email+phone grid), add:

```tsx
{/* Second Parent / Guardian (optional) */}
<div className="border-t border-gray-100 pt-4 mt-1">
  {!form.secondary_parent_name && !form.secondary_parent_email && !form.secondary_parent_phone ? (
    <button
      type="button"
      onClick={() => update("secondary_parent_name", " ")}
      className="text-sm text-flag-blue hover:text-flag-blue-mid font-semibold transition-colors"
    >
      + Add a second parent / guardian
    </button>
  ) : (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-charcoal">
          Second Parent / Guardian <span className="text-gray-400 font-normal">(optional)</span>
        </p>
        <button
          type="button"
          onClick={() => {
            update("secondary_parent_name", "");
            update("secondary_parent_email", "");
            update("secondary_parent_phone", "");
          }}
          className="text-xs text-gray-400 hover:text-flag-red transition-colors"
        >
          Remove
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="secondary_parent_name">Full Name</FieldLabel>
          <TextInput
            id="secondary_parent_name"
            value={form.secondary_parent_name.trim() === "" ? "" : form.secondary_parent_name}
            onChange={(v) => update("secondary_parent_name", v)}
            placeholder="John Smith"
            autoComplete="name"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="secondary_parent_email">Email</FieldLabel>
            <TextInput
              id="secondary_parent_email"
              type="email"
              value={form.secondary_parent_email}
              onChange={(v) => update("secondary_parent_email", v)}
              placeholder="john@email.com"
              autoComplete="email"
              inputMode="email"
            />
            <p className="text-gray-400 text-xs mt-1">
              If provided, this parent can sign in to the portal.
            </p>
          </div>
          <div>
            <FieldLabel htmlFor="secondary_parent_phone">Phone</FieldLabel>
            <TextInput
              id="secondary_parent_phone"
              type="tel"
              value={form.secondary_parent_phone}
              onChange={(v) => updatePhone("secondary_parent_phone", v)}
              placeholder="(949) 555-5678"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </div>
      </div>
    </>
  )}
</div>
```

**Step 3: Update the `updatePhone` callback to accept the new field**

Change the type constraint on `updatePhone` (around line 296):

```typescript
(key: "parent_phone" | "emergency_contact_phone" | "secondary_parent_phone", raw: string) => {
```

**Step 4: Add secondary parent fields to the submit payload**

In `handleSubmit` (around line 378), add to the `payload` object:

```typescript
secondary_parent_name: form.secondary_parent_name.trim() || null,
secondary_parent_email: form.secondary_parent_email.trim().toLowerCase() || null,
secondary_parent_phone: form.secondary_parent_phone.trim() || null,
```

**Step 5: Preserve secondary parent data on "Register Another Child"**

In the "Register Another Child" button handler (around line 516), add to the preserved fields:

```typescript
secondary_parent_name: form.secondary_parent_name,
secondary_parent_email: form.secondary_parent_email,
secondary_parent_phone: form.secondary_parent_phone,
```

**Step 6: Verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 7: Commit**

```
feat: add second parent fields to registration form
```

---

### Task 3: Parent Portal — Second Parent Management Card

**Files:**
- Modify: `src/app/portal/page.tsx`

**Step 1: Add secondary parent fields to the Registration interface**

Add to the `Registration` interface (around line 16):

```typescript
secondary_parent_name: string | null;
secondary_parent_email: string | null;
secondary_parent_phone: string | null;
```

**Step 2: Add secondary parent fields to the Supabase select query**

In `fetchData` (around line 221), update the `.select()` to include:

```
..., secondary_parent_name, secondary_parent_email, secondary_parent_phone
```

**Step 3: Add state for the edit form**

Add state variables after existing state (around line 161):

```typescript
const [editingSecondParent, setEditingSecondParent] = useState<string | null>(null);
const [secondParentForm, setSecondParentForm] = useState({ name: "", email: "", phone: "" });
```

**Step 4: Add save handler**

Add a function after `acceptSelection` (around line 200):

```typescript
async function saveSecondParent(regId: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from("tryout_registrations")
    .update({
      secondary_parent_name: secondParentForm.name.trim() || null,
      secondary_parent_email: secondParentForm.email.trim().toLowerCase() || null,
      secondary_parent_phone: secondParentForm.phone.trim() || null,
    })
    .eq("id", regId);

  if (error) {
    alert("Failed to save. Please try again.");
    return;
  }

  setRegistrations((prev) =>
    prev.map((r) =>
      r.id === regId
        ? {
            ...r,
            secondary_parent_name: secondParentForm.name.trim() || null,
            secondary_parent_email: secondParentForm.email.trim().toLowerCase() || null,
            secondary_parent_phone: secondParentForm.phone.trim() || null,
          }
        : r
    )
  );
  setEditingSecondParent(null);
}
```

**Step 5: Add the Second Parent card to the dashboard**

Inside the `registrations.map()` in the "My Player's Status" section (around line 567, right before the closing `</div>` of each registration card and after the tryout time/incomplete registration block), add:

```tsx
{/* Second Parent / Guardian */}
<div className="mt-4 border-t border-gray-100 pt-4">
  {editingSecondParent === reg.id ? (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Second Parent / Guardian
      </p>
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Full Name</label>
        <input
          type="text"
          value={secondParentForm.name}
          onChange={(e) => setSecondParentForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="John Smith"
          className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-star-gold/30 focus:border-star-gold transition-colors"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Email</label>
          <input
            type="email"
            value={secondParentForm.email}
            onChange={(e) => setSecondParentForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="john@email.com"
            className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-star-gold/30 focus:border-star-gold transition-colors"
          />
          <p className="text-gray-400 text-xs mt-1">This parent can sign in to the portal with this email.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Phone</label>
          <input
            type="tel"
            value={secondParentForm.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              let formatted = digits;
              if (digits.length <= 3) formatted = digits;
              else if (digits.length <= 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
              else formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
              setSecondParentForm((f) => ({ ...f, phone: formatted }));
            }}
            placeholder="(949) 555-5678"
            className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-star-gold/30 focus:border-star-gold transition-colors"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => saveSecondParent(reg.id)}
          className="bg-flag-blue hover:bg-flag-blue-mid text-white px-5 py-2.5 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors min-h-[44px]"
        >
          Save
        </button>
        <button
          onClick={() => setEditingSecondParent(null)}
          className="border border-gray-200 hover:border-gray-400 text-gray-600 px-5 py-2.5 rounded-full font-display text-xs font-semibold uppercase tracking-widest transition-colors min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : reg.secondary_parent_name || reg.secondary_parent_email || reg.secondary_parent_phone ? (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Second Parent / Guardian
        </p>
        {reg.secondary_parent_name && (
          <p className="text-sm font-medium text-charcoal">{reg.secondary_parent_name}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-0.5">
          {reg.secondary_parent_email && <span>{reg.secondary_parent_email}</span>}
          {reg.secondary_parent_phone && <span>{reg.secondary_parent_phone}</span>}
        </div>
      </div>
      <button
        onClick={() => {
          setSecondParentForm({
            name: reg.secondary_parent_name ?? "",
            email: reg.secondary_parent_email ?? "",
            phone: reg.secondary_parent_phone ?? "",
          });
          setEditingSecondParent(reg.id);
        }}
        className="text-gray-400 hover:text-flag-blue transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Edit second parent"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </button>
    </div>
  ) : (
    <button
      onClick={() => {
        setSecondParentForm({ name: "", email: "", phone: "" });
        setEditingSecondParent(reg.id);
      }}
      className="text-sm text-flag-blue hover:text-flag-blue-mid font-semibold transition-colors"
    >
      + Add a second parent / guardian
    </button>
  )}
</div>
```

**Step 6: Verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 7: Commit**

```
feat: add second parent management to parent portal dashboard
```

---

### Task 4: Coach Roster — Show Second Parent

**Files:**
- Modify: `src/app/coach/roster/page.tsx`

**Step 1: Add secondary parent fields to the Registration interface**

Add to the `Registration` interface (around line 24):

```typescript
secondary_parent_name: string | null;
secondary_parent_email: string | null;
secondary_parent_phone: string | null;
```

**Step 2: Add fields to the Supabase select query**

In `fetchAll` (around line 415), update the `.select()` string to include:

```
..., secondary_parent_name, secondary_parent_email, secondary_parent_phone
```

**Step 3: Add Second Parent section to the PlayerCard**

In the `PlayerCard` component's contact grid (around line 261-304), add a third column block between the Parent Contact and Emergency Contact sections. Wrap the grid in a responsive layout — change from `md:grid-cols-2` to a conditional layout, or add the third section below the existing two-column grid.

After the Emergency Contact `</div>` (around line 303) and before the closing `</div>` of the contact grid:

```tsx
{/* Second Parent/Guardian */}
{(reg.secondary_parent_name || reg.secondary_parent_email || reg.secondary_parent_phone) && (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
      Second Parent / Guardian
    </p>
    {reg.secondary_parent_name && (
      <p className="text-sm font-medium text-charcoal mb-1">
        {reg.secondary_parent_name}
      </p>
    )}
    <div className="space-y-1">
      {reg.secondary_parent_email && (
        <a
          href={`mailto:${reg.secondary_parent_email}`}
          className="flex items-center gap-1.5 text-sm text-flag-blue hover:underline"
        >
          <Mail size={14} className="shrink-0" />
          <span className="truncate">{reg.secondary_parent_email}</span>
        </a>
      )}
      {reg.secondary_parent_phone && (
        <a
          href={`tel:${reg.secondary_parent_phone}`}
          className="flex items-center gap-1.5 text-sm text-flag-blue hover:underline"
        >
          <Phone size={14} className="shrink-0" />
          {reg.secondary_parent_phone}
        </a>
      )}
    </div>
  </div>
)}
```

Also update the contact grid from `md:grid-cols-2` to `md:grid-cols-2 lg:grid-cols-3` at line 261 so the three contact sections lay out nicely when all present.

**Step 4: Verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 5: Commit**

```
feat: show second parent on coach roster
```

---

### Task 5: Admin Tryouts Page — Show Second Parent

**Files:**
- Modify: `src/app/admin/tryouts/page.tsx`

**Step 1: Add secondary parent fields to the admin interface and query**

Find the interface for registration data and the `.select()` query. Add `secondary_parent_name`, `secondary_parent_email`, `secondary_parent_phone` to both.

**Step 2: Display second parent info**

Find where `parent_phone` is displayed (around line 1384) and add the second parent info below it, only if any field is populated.

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```
feat: show second parent info in admin tryouts view
```

---

### Task 6: Build, Deploy, and Verify

**Step 1: Final build check**

Run: `npm run build`
Expected: Build succeeds with zero errors.

**Step 2: Deploy to VPS**

```bash
ssh irvine "cd /var/www/irvineallstars && git pull && npm run build && pm2 restart irvineallstars"
```

**Step 3: Manual verification checklist**

- [ ] Registration form: "Add a second parent/guardian" link appears in Step 1
- [ ] Registration form: Clicking it reveals name/email/phone fields
- [ ] Registration form: Submitting with second parent data saves to DB
- [ ] Portal dashboard: "Add a second parent" link appears for each player
- [ ] Portal dashboard: Can add, edit, and clear second parent info
- [ ] Coach roster: Second parent section appears when data exists
- [ ] Coach roster: Section hidden when no second parent data
- [ ] Admin tryouts: Second parent info shows in registration details

**Step 4: Commit session log**

Write session log to `tasks/session-2026-04-05-e.md`.
