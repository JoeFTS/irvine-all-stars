# Testing Guide — Coach, Parent & Admin Flows

## Setup: Create Test Accounts

You already have an admin account:
- **Admin:** allstars@irvinepony.com / Refreeze8!Decorated!Tuition

You'll need a coach and parent account. Ask Claude to create them, or do it manually:

1. Go to https://irvineallstars.com/auth/signup and create two accounts
2. Then ask Claude to update their roles in the profiles table:
   - Set one to `role = 'coach'`
   - Set one to `role = 'parent'`

---

## Flow 1: Parent

### Step 1: Register a Player
1. Go to https://irvineallstars.com/apply/player
2. Fill out the 3-step form (parent info → player info → consent)
3. Submit — you should see a success message
4. Check your email for the confirmation

### Step 2: Log In as Parent
1. Go to https://irvineallstars.com/auth/login
2. Sign in with your parent account
3. You should land on /portal

### Step 3: Check Compliance Checklist
1. On the portal home, you should see "What's Needed From You"
2. It should show your registered player with 4 items:
   - ✅ Register for tryouts (already done)
   - ⬜ Upload birth certificate
   - ⬜ Upload player photo
   - ⬜ Sign player contract
3. Progress bar should show "1 of 4 complete"

### Step 4: Upload Documents
1. Click "Upload birth certificate" link or go to /portal/documents
2. You should see your player's name and division
3. Upload a test image or PDF for the birth certificate
4. Upload a test image for the player photo
5. Both should show green checkmarks after upload

### Step 5: Sign Player Contract
1. Go to /portal/contract
2. If you have multiple players, select one from the dropdown
3. Read through the contract text
4. Check all 7 acknowledgment boxes
5. Optionally enter planned vacations
6. Type your full name in the signature field
7. Click Submit
8. Should show success with green checkmark

### Step 6: Verify Compliance
1. Go back to /portal
2. The checklist should now show 4 of 4 complete with green "All Complete" badge

---

## Flow 2: Coach

### Step 1: Log In as Coach
1. Go to https://irvineallstars.com/auth/login
2. Sign in with coach account
3. Should redirect to /coach
4. Navbar should show "Coach Dashboard" button (not "Parent Portal")

### Step 2: Binder Checklist
1. Click "Binder Checklist" in sidebar (or go to /coach/checklist)
2. Should see:
   - Team-level requirements (insurance cert, concussion cert, cardiac arrest cert)
   - Affidavit instructions box
   - Per-player checklist cards showing document status
3. If the parent uploaded docs in Flow 1, those should show as ✅

### Step 3: Roster View
1. Click "Roster" in sidebar (or go to /coach/roster)
2. Should see summary stats (Total Players, Tournament Ready, Needs Attention)
3. Player cards with parent contact info and document status badges
4. Try the division filter buttons

### Step 4: Certifications
1. Click "Certifications" in sidebar (or go to /coach/certifications)
2. Should see two certification cards:
   - Youth Sports Concussion Protocol — with resource links
   - Sudden Cardiac Arrest Prevention — with resource links
3. Click a resource link to verify it opens
4. Upload a test file as a certification
5. Should show green "Completed" badge after upload

### Step 5: Tournament Rules
1. Click "Tournament Rules" in sidebar (or go to /coach/tournament-rules)
2. Should see division tabs: Shetland, Pinto MP, Pinto KP, Mustang/Bronco
3. Click each tab — rules content should change
4. At bottom, check the acknowledgment box
5. Type your name and click "Acknowledge Rules"
6. Should show green badge with date
7. Switch to another division tab and repeat

### Step 6: Updates
1. Click "Updates" in sidebar (or go to /coach/updates)
2. Should see:
   - Important tournament links
   - Season overview (schedule, hosting, scoring, meetings)
   - Rules of Note
   - Uniform info
   - Announcements feed

---

## Flow 3: Admin

### Step 1: Log In as Admin
1. Go to https://irvineallstars.com/auth/login
2. Sign in with allstars@irvinepony.com
3. Should redirect to /admin

### Step 2: Team Management
1. Click "Teams" in sidebar (or go to /admin/teams)
2. Create a team:
   - Select a division (e.g., "9U-Mustang")
   - Enter a team name (e.g., "9U Blue")
   - Enter the coach's email
   - Click "Create Team"
3. The team should appear in the list with compliance stats
4. Try deleting a team (click Delete, then confirm)

### Step 3: Check Registrations
1. Go to /admin/registrations
2. If the parent registered a player in Flow 1, it should appear
3. Try expanding the registration to see player details
4. Try changing the status

### Step 4: Check Applications
1. Go to /admin/applications
2. Your existing test application (Joe Hernandez) should be there
3. Try updating its status

### Step 5: Post an Announcement
1. Go to /admin/announcements
2. Create a test announcement
3. Then check /coach/updates — the announcement should appear in the feed
4. Check /portal — if targeted to a division, it should appear for parents in that division

### Step 6: Admin Can Access Coach Pages
1. Navigate to /coach directly as admin
2. Admin role should have access to all coach pages (for oversight)

---

## What to Look For (Common Issues)

- **Sign Out:** Click Sign Out — should clear session and redirect to homepage
- **Sign In button:** When logged out, navbar should show "Sign In" (red button)
- **Role routing:** Admin → /admin, Coach → /coach, Parent → /portal
- **Mobile:** Test on phone or resize browser — sidebar should become bottom tabs
- **Empty states:** Pages should show helpful messages when no data exists
- **File uploads:** Try uploading images (JPG/PNG) and PDFs — both should work
- **Validation:** Try submitting the contract without checking all boxes — should show errors
