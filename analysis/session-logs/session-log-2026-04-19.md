# Session Log: 2026-04-19

## Objective

Load Coach Ty Kincade's 10U-Mustang roster (12 players) into the production database, then build a feature that lets any coach upload a player's signed contract file (PDF or image) directly from the roster page — parallel path to the existing online e-signed contract flow.

Ty's division does contracts on paper, so the coach-upload path was a hard blocker on him using the roster at all. After this session, Ty can see all 12 players, each with a green "Uploaded ✓" contract badge that opens the signed PDF/JPEG in a new tab.

## What Was Done

### 1. Loaded Coach Ty's 10U-Mustang Roster

Coach profile (`irvine_allstars.profiles`): `tynerkincade@yahoo.com` / `Ty Kincade` / `role=coach` / `division=10U-Mustang` / `id=5b5fd0b4-319d-4818-98f3-0fb67765da16`.

User supplied 12 player + parent + email rows. Inserted 11 into `irvine_allstars.tryout_registrations` with `status='selected'`, `division='10U-Mustang'`. The 12th (Cammy Kincade) already existed with `status='registered'` — flipped to `'selected'` rather than duplicating.

Family with an existing 12U-Bronco row ("Benny Ly" / `karl.ly@gmail.com`) was left untouched; new 10U row added for their other kid Nolan Ly.

Registration IDs (used downstream for contract uploads):

| Player | Parent | registration_id |
|---|---|---|
| Kimi Xiang | Meadow Zhou | 277d124f-b3d5-40ab-b23a-546c4c27fee7 |
| Kathan Gabriel Mejia | Hanzel Mejia | ac0a595d-2ea9-4d1a-90e1-a05703626981 |
| Eric Scholl | Chris Scholl | 2ff147ad-1821-44ad-9c3c-09113dce7800 |
| Ivan Chen | Irene Zhang | db3335ac-49d3-4df6-bef4-a15057c17f00 |
| Easton Dennis | Andy Dennis | 716b5c80-e991-4c2b-9945-353cefea7f62 |
| Anthony Liu | Vic Liu | a0872697-6e38-44c3-bfe1-67538631dce3 |
| Jay Ludwig | Jeff Ludwig | 28ecb501-b6bb-4ce0-bde4-80d57c45f738 |
| Marshall Tsang | Kit Tsang | f193da13-5dd5-40a7-aca4-dadfe8885277 |
| Ezekiel Brinnon | Jeremiah Brinnon | a1ea1367-b422-4396-96f9-2fb424543f2d |
| Nolan Ly | Karl Ly | 6cf75f1e-8864-4a2d-98a0-7eca066de81d |
| Brayden Strelzow | Adrian Strelzow | e6a2a7c4-de21-450a-97f2-3d5389b727dc |
| Cammy Kincade | Ty Kincade | ea99ffe2-5456-4da2-9c2d-635bb7b4f636 |

### 2. Verified Parent Names On Each Contract

Read all 12 files at `shared-content/documents/Coach Ty 10u Contracts/`. All 12 belong to the right family. Notes:

- **Brayden Strelzow** — contract signed by Elaine Hu (mom), email `elaine461@gmail.com`. Coach listed dad (Adrian). Same household.
- **Eric Scholl** — contract signed by Kathryn Scholl (mom), email `kathrynscholl83@gmail.com`. Coach listed dad (Chris). Same household.
- **Ivan Chen** — signed by Ying Zhang. Coach listed Irene Zhang. Same email (`irenezhang201702@gmail.com`) — Irene = English name, Ying = native.
- **Kimi Xiang** — signed by Muhan Zhou. Coach listed Meadow Zhou. Same email (`muhanzhou29@gmail.com`) — Meadow = English name.
- **Kathan Gabriel Mejia** — signed by "Hanzel Muyo Pedroza Mejia" (full name). Matches coach's "Hanzel Mejia".
- **Marshall Tsang** — signed by "Yung Kit Tsang" (full name). Matches coach's "Kit Tsang".
- Remaining 6 (Anthony, Cammy, Easton, Ezekiel, Jay, Nolan) — exact parent name match.

### 3. Feature — Coach-Uploaded Player Contracts

#### Storage + DB model

- Bucket: `player-documents`
- Path convention: `signed-contracts/{registration_id}/{timestamp}-{filename}`
- Table: `irvine_allstars.player_documents`
- New `document_type` value: `signed_contract` (sits alongside existing `birth_certificate`, `player_photo`, `medical_release`, `selection_acceptance`, `signed_medical_release`)
- Status on coach-upload: `'approved'` (coach is the authority — we trust them)

No schema migration required. `document_type` is a free-text column, RLS already allows authenticated users to INSERT.

#### Bulk import script

`scripts/upload-coach-ty-contracts.mjs` — uploaded the 12 existing files to storage and inserted 12 `player_documents` rows. Keeps as a template for future bulk imports from other divisions if coaches dump paper stacks on Joe.

#### Roster page behavior (`src/app/coach/roster/page.tsx`)

- `getPlayerCompliance` now returns `contract` = (e-signed OR coach-uploaded), plus two new flags `contractSigned` and `contractUploaded` so the badge can differentiate.
- `fetchAll` computes `rosterIds` as the union of `player_contracts` rows (e-signed online) and `player_documents` rows where `document_type='signed_contract'` (coach-uploaded). Players land on main roster when either source exists.
- Contract `DocBadge` label reads "Signed" for e-signed, "Uploaded" for coach-uploaded. Click:
  - If e-signed → opens `/contract-view?id={regId}` (existing view-only page)
  - If uploaded → generates a 5-minute signed URL for the stored file and opens in a new tab
- Awaiting Response cards grew a new "Upload Contract" button per player. Clicking expands an inline `FileUpload` component targeting `signed-contracts/{regId}`. On upload complete, inserts the `player_documents` row and re-fetches — the player moves from awaiting → main roster.

#### Parent portal gate (`src/app/portal/documents/page.tsx`)

Parent portal only unlocks document-upload UI when the contract is "complete". Widened that gate from `player_contracts has row` to `player_contracts has row OR player_documents has signed_contract`. This way, when a coach uploads, the parent can still log in and upload birth cert / player photo without being blocked.

### 4. Verification

Flipped test coach (`thesupplycomp@gmail.com`) profile division to `10U-Mustang` temporarily, logged in via Playwright at `localhost:3001/coach/roster`. Confirmed:

- All 12 players on main roster, each with green "Uploaded ✓" contract badge.
- Clicking the badge opens the correct signed PDF/JPEG in a new tab (storage signed URL).
- Screenshot saved at `.playwright-mcp/coach-ty-roster.png`.

Reverted test coach division back to `12U-Bronco`.

### 5. Deploy

- Commit `0a0e6f8` — `feat(roster): coaches can upload player contracts`
- Pushed to `origin/main`
- VPS deploy: `ssh vps "cd /var/www/irvineallstars && git pull && rm -rf .next && npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && pm2 restart irvineallstars"`
- Verified `https://irvineallstars.com/coach/roster` returns HTTP 200

## DB State At Session End

- `irvine_allstars.profiles` — test coach `thesupplycomp@gmail.com` division = `12U-Bronco` (restored)
- `irvine_allstars.tryout_registrations` — 12 rows for 10U-Mustang, all `status='selected'`
- `irvine_allstars.player_documents` — 12 rows `document_type='signed_contract'`, `status='approved'`, all belonging to Coach Ty's 10U-Mustang registrations
- Storage `player-documents/signed-contracts/{regId}/...` — 12 files

## Open Follow-Ups

Coach also needs to upload **player photos** and **birth certificates** on behalf of parents (same reasoning — parents don't always have them or can't use the portal). That's the next session — fresh prompt handed over.

## Files Changed

- `src/app/coach/roster/page.tsx` — contract upload flow + awaiting card button
- `src/app/portal/documents/page.tsx` — widened unlock gate
- `.gitignore` — ignore `/shared-content` (local-only)
- `scripts/upload-coach-ty-contracts.mjs` — new, bulk import template
