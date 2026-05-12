"""De-dupe tryout_registrations.

First run on 2026-05-12 to clean up 14 duplicate rows from parents who
registered the same kid multiple times during signup. Second pass on
2026-05-12 (same day) cleaned 4 more after parents re-submitted via
/apply/player; that loophole is now closed by the dedupe guard in
player-registration-form.tsx. The script is idempotent — if the dupes
are already gone it's a no-op.

For each group:
- Pick the canonical keeper (the row that's status=selected and has team_id).
- Reassign any player_documents / player_contracts FK rows to the keeper.
- Optionally overwrite the keeper's secondary_parent_email with a parent
  email from a dropped row that wasn't already on the keeper (used to bring
  in mom's address when keeper had two of dad's emails).
- Delete the dropped rows.

Conflicts on parent-email slots were resolved interactively at run time:
- Kai Mitchell: dropped keeper's `kent.mitchell@hotmail.com` (Kent's 2nd
  inbox) to make room for `myaimitchell825@gmail.com` (mom).
- Drew Huang: dropped keeper's `charles.huang11@gmail.com` (Dad's 2nd
  inbox) to make room for `cindymhuang@gmail.com` (mom).
- Maxwell Hay: keeper sec slot was empty; added `bhankhay@gmail.com`
  (Coach Brandon).
- Qiaobin Sun: merged across 5 rows (3 with dob 2016-10-29, 1 future-dob
  typo, 1 day-typo). All same family — no new parent emails to preserve.
- Nolan Nguyen: dob typo on the dupe; same family.

See `feedback_dedupe_preserve_secondary_parent` memory for the
secondary-parent preservation rule that informed this pass.
"""

import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


HERE = Path(__file__).resolve().parent


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = {**os.environ, **load_env(HERE.parent / ".env.local")}
SUPA = ENV["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]


def supa(method: str, path: str, body=None):
    req = Request(
        f"{SUPA}/rest/v1/{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Accept-Profile": "irvine_allstars",
            "Content-Profile": "irvine_allstars",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method=method,
    )
    try:
        with urlopen(req, timeout=30) as r:
            txt = r.read().decode() or "[]"
            return json.loads(txt) if txt.startswith(("[", "{")) else []
    except HTTPError as e:
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {e.read().decode()}")


# Each entry: keeper id, ids to drop, optional sec_email + sec_name to push onto keeper.
PLAN = [
    # Colin Bonuan
    {
        "label": "Colin Bonuan",
        "keep": "d95e4c9d-9b4c-446d-9079-2d1330da964f",
        "drop": ["158d2693-e445-4cff-8be9-a3da65d5811c"],
        "sec_email": None,
        "sec_name": None,
    },
    # Drew Huang - mom's email replaces dad's 2nd
    {
        "label": "Drew Huang",
        "keep": "ee285424-117e-4807-a056-2dd800ae129f",
        "drop": ["5940a52f-f7ca-4adf-918a-55d03a041959"],
        "sec_email": "cindymhuang@gmail.com",
        "sec_name": "Cindy Huang",
    },
    # Kai Mitchell - mom's email replaces Kent's 2nd
    {
        "label": "Kai Mitchell",
        "keep": "edbba4f7-8568-4135-aab9-e31344fb8f13",
        "drop": [
            "67677ac0-a624-40a8-bf18-877302029e9b",
            "5b7a2f20-8fe3-4bca-8b51-f03e9b674571",
            "22d36fc3-313d-49f9-a967-18be18d0c4a0",
        ],
        "sec_email": "myaimitchell825@gmail.com",
        "sec_name": "Myai Mitchell",
    },
    # Maxwell Hay - empty sec slot, add coach Brandon
    {
        "label": "Maxwell Hay",
        "keep": "b164aa31-a37d-427b-a571-58e61066ee2f",
        "drop": [
            "5594c350-534a-4ba0-afd0-18b117d5a767",
            "83be9be1-2702-40ec-ae40-6e071f8f0210",
        ],
        "sec_email": "bhankhay@gmail.com",
        "sec_name": "Brandon Hay",
    },
    # Qiaobin Sun - 5 dupes (incl. dob typos)
    {
        "label": "Qiaobin Sun",
        "keep": "d6a4de56-cb9f-440c-8646-4a2034da12de",
        "drop": [
            "9d42b38f-524d-4e95-80b3-e373af67b8fe",
            "7190de27-c918-4097-b5a4-f5bcfdf2c1f1",
            "190255fd-0f3d-42e2-a14c-8ab7099fc3f5",
            "425bca22-080b-4ec1-bd1f-06ed36ccb416",
            "3547bb99-4d69-47ca-8c04-f84c2ad9af86",
            "258d9c34-7e17-4470-a000-43b32f2ab6d7",
        ],
        "sec_email": None,
        "sec_name": None,
    },
    # Nolan Nguyen - dob typo
    {
        "label": "Nolan Nguyen",
        "keep": "ff3f86d7-dfd3-41c5-9ef0-44c19be3b946",
        "drop": ["521495bf-297e-4eff-be91-459095c2e2dc"],
        "sec_email": None,
        "sec_name": None,
    },
]

# Second-pass dupes cleaned 2026-05-12 (after parents re-submitted via
# /apply/player before the form-side dedupe guard was deployed). All
# kept parent emails were already covered by the keeper, so no email
# preservation was needed. Recorded here for posterity; ids elide for
# brevity since the rows are already deleted.
#
#   Kai Mitchell     keeper edbba4f7  drops cafd9f7f, dc3a829c, 1d391d8e
#   Roshan Ausmus    keeper 1de45db8  drops ce105136
#   Alexander Seto   keeper 6a608596  drops d6f7f4eb
#   Enzo Novia       keeper 390220be  drops 9eac66cc


def run_plan(dry_run: bool) -> None:
    for op in PLAN:
        keep = op["keep"]
        # Skip if keeper isn't there (already cleaned up)
        keeper_rows = supa("GET", f"tryout_registrations?id=eq.{keep}&select=id")
        if not keeper_rows:
            print(f"[skip] {op['label']}: keeper {keep[:8]} not found")
            continue

        # Bring in the secondary parent email if specified
        if op["sec_email"]:
            print(f"[{op['label']}] keeper {keep[:8]}: set sec_email={op['sec_email']}")
            if not dry_run:
                supa("PATCH", f"tryout_registrations?id=eq.{keep}", {
                    "secondary_parent_email": op["sec_email"],
                    "secondary_parent_name": op["sec_name"],
                })

        for drop_id in op["drop"]:
            existing = supa("GET", f"tryout_registrations?id=eq.{drop_id}&select=id")
            if not existing:
                print(f"[{op['label']}] {drop_id[:8]} already gone")
                continue
            for table in ("player_documents", "player_contracts"):
                rows = supa("GET", f"{table}?registration_id=eq.{drop_id}&select=id")
                if rows:
                    print(f"[{op['label']}] reassign {len(rows)} {table} from {drop_id[:8]} -> {keep[:8]}")
                    if not dry_run:
                        supa("PATCH", f"{table}?registration_id=eq.{drop_id}",
                             {"registration_id": keep})
            print(f"[{op['label']}] delete {drop_id[:8]}")
            if not dry_run:
                supa("DELETE", f"tryout_registrations?id=eq.{drop_id}")


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("(dry-run — no DB writes)\n")
    run_plan(dry_run)
    print("\nDone.")


if __name__ == "__main__":
    main()
