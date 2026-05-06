"""Upsert all 177 SE All-Stars registrations into irvine_allstars.tryout_registrations,
tagging each with team_id from teams table based on parent-declared Team Name."""
import csv
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

CSV_PATH = Path("/Users/joe/irvine-all-stars/.playwright-mcp/unnamed-report.csv")
SUPA_REF = "owuempqaheupjyslkjlg"
SUPA_TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]


# csv "Team Name" -> (team_id, division)
TEAM_LOOKUP = {
    "5u Negrete":        ("88c93e80-7e07-4e6a-8e85-86a9ed629959", "5U-Shetland"),
    "6u Juarigue":       ("d139e811-ee1f-4f03-adea-b603bff7281b", "6U-Shetland"),
    "6u Judy":           ("d8b1af7b-e4fe-4f24-8ef9-0ee95b261769", "6U-Shetland"),
    "7u MP Singer":      ("dcf95474-f3d1-4da4-85c6-2414b52ca162", "7U MP-Pinto"),
    "8u MP Hay":         ("33fd6261-13d2-4b88-ad8d-018d8a9d7e4c", "8U MP-Pinto"),
    "8u MP Seto/White":  ("67773a97-7d6b-4683-af93-83d42461f314", "8U MP-Pinto"),
    "8u KP Watts":       ("4fb96b55-b76b-4fa0-9fad-d25395c49e1e", "8U KP-Pinto"),
    "9u Bernal":         ("d3515125-f16b-4c21-a1d2-330a750ec05e", "9U-Mustang"),
    "9u Grifka":         ("3138c86b-1223-49f9-ab74-c1108260b961", "9U-Mustang"),
    "9u Hopp":           ("dc626a84-a58d-4383-8a35-2e0d53963b0e", "9U-Mustang"),
    "10u Kincade":       ("de43c2eb-88cb-4d99-b4a2-d8f93a4db213", "10U-Mustang"),  # Mustang 10U White
    "10u Stites":        ("5341084b-dedc-47aa-8550-d6d46db51208", "10U-Mustang"),  # Mustang 10U Gray
    "11u Frisch":        ("f4180f2d-d02d-4d54-aa13-cb31ea6c3584", "11U-Bronco"),
    "12u Hernandez":     ("c72e4613-7e30-4113-995e-5e0e3135e140", "12U-Bronco"),
    "12u Sobel/Bailon":  ("437577e6-29f7-484e-b524-63c0985cf37f", "12U-Bronco"),  # Bronco 12U Blue
}


def supa_sql(sql, max_retries=4):
    for attempt in range(max_retries):
        req = Request(
            f"https://api.supabase.com/v1/projects/{SUPA_REF}/database/query",
            data=json.dumps({"query": sql}).encode(),
            headers={"Authorization": f"Bearer {SUPA_TOKEN}", "Content-Type": "application/json", "User-Agent": "curl/8.7.1"},
            method="POST",
        )
        try:
            with urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode() or "[]")
        except HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                wait = 2 ** attempt * 5  # 5, 10, 20, 40 sec
                time.sleep(wait)
                continue
            raise


def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def parse_dob(s):
    """MM/DD/YYYY -> YYYY-MM-DD"""
    if not s:
        return None
    try:
        return datetime.strptime(s.strip(), "%m/%d/%Y").date().isoformat()
    except ValueError:
        return None


def parse_submitted(s):
    """'04/21/2026, 11:05pm PDT' -> ISO timestamp"""
    if not s:
        return None
    try:
        # strip timezone label
        clean = s.replace(" PDT", "").replace(" PST", "").strip()
        return datetime.strptime(clean, "%m/%d/%Y, %I:%M%p").isoformat()
    except ValueError:
        return None


def load_csv():
    rows = []
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            cleaned = {}
            for k, v in r.items():
                key = k.replace("\\uFEFF", "").replace("﻿", "").strip()
                cleaned[key] = (v or "").strip()
            rows.append(cleaned)
    return rows


def address_one_line(r):
    parts = []
    if r.get("Street Address 1"):
        parts.append(r["Street Address 1"])
    if r.get("Street Address 2"):
        parts.append(r["Street Address 2"])
    csz = []
    if r.get("City"):
        csz.append(r["City"])
    if r.get("State / Province"):
        csz.append(r["State / Province"])
    line2 = ", ".join(csz)
    if r.get("Postal Code"):
        line2 = f"{line2} {r['Postal Code']}".strip()
    out = ", ".join([p for p in parts if p])
    if line2:
        out = f"{out}, {line2}" if out else line2
    return out


def upsert_one(r):
    team_name = r.get("Team Name", "")
    team_id, division = TEAM_LOOKUP.get(team_name, (None, None))

    parent_name = (r.get("First Name_cp1", "") + " " + r.get("Last Name_cp1", "")).strip()
    parent_email = (r.get("Email_cp1") or r.get("Account Email") or "").lower()
    secondary_email = (r.get("Secondary Email") or "").lower() or None
    if secondary_email == parent_email:
        secondary_email = None

    pfn = r.get("First Name", "").strip()
    pln = r.get("Last Name", "").strip()
    dob = parse_dob(r.get("Date of Birth", ""))
    submitted = parse_submitted(r.get("Registration Date", ""))

    # Try update first (match on email + first/last)
    if dob:
        update_sql = f"""
        UPDATE irvine_allstars.tryout_registrations SET
          team_id = COALESCE(team_id, {esc(team_id)}::uuid),
          parent_name = COALESCE(NULLIF(parent_name,''), {esc(parent_name)}),
          parent_phone = COALESCE(NULLIF(parent_phone,''), {esc(r.get("Cell Phone Number NEW") or None)}),
          secondary_parent_email = COALESCE(NULLIF(secondary_parent_email,''), {esc(secondary_email)}),
          current_team = COALESCE(NULLIF(current_team,''), {esc(team_name)}),
          division = COALESCE(NULLIF(division,''), {esc(division)})
        WHERE LOWER(parent_email) = {esc(parent_email)}
          AND LOWER(player_first_name) = LOWER({esc(pfn)})
          AND LOWER(player_last_name) = LOWER({esc(pln)})
        RETURNING id;
        """
        res = supa_sql(update_sql)
        if res:
            return ("updated", team_id, team_name)

    # Insert new
    insert_sql = f"""
    INSERT INTO irvine_allstars.tryout_registrations
      (parent_name, parent_email, parent_phone, secondary_parent_email,
       player_first_name, player_last_name, player_date_of_birth,
       division, current_team, team_id, status, submitted_at)
    VALUES (
      {esc(parent_name)},
      {esc(parent_email)},
      {esc(r.get("Cell Phone Number NEW") or None)},
      {esc(secondary_email)},
      {esc(pfn)},
      {esc(pln)},
      {esc(dob)}::date,
      {esc(division)},
      {esc(team_name)},
      {esc(team_id)}::uuid,
      'registered',
      COALESCE({esc(submitted)}::timestamptz, NOW())
    )
    RETURNING id;
    """
    supa_sql(insert_sql)
    return ("inserted", team_id, team_name)


def main():
    dry = "--dry-run" in sys.argv
    rows = load_csv()
    print(f"{'DRY RUN — ' if dry else ''}Processing {len(rows)} registrations...")
    counts = {"updated": 0, "inserted": 0, "no_team": 0}
    by_team = {}
    for i, r in enumerate(rows, 1):
        team_name = r.get("Team Name", "")
        team_id, _ = TEAM_LOOKUP.get(team_name, (None, None))
        if not team_id:
            counts["no_team"] += 1
        if dry:
            by_team.setdefault(team_name, 0)
            by_team[team_name] += 1
            continue
        try:
            action, tid, tn = upsert_one(r)
            counts[action] += 1
            by_team.setdefault(tn, 0)
            by_team[tn] += 1
            if i % 25 == 0:
                print(f"  ...{i}/{len(rows)}")
        except Exception as e:
            print(f"  !! {r.get('First Name')} {r.get('Last Name')}: {e}")
        time.sleep(0.6)  # ~100 req/min, well under 120/min limit
    print()
    print(f"Updated: {counts['updated']}, Inserted: {counts['inserted']}, No team mapping: {counts['no_team']}")
    print()
    print("Per team:")
    for k in sorted(by_team):
        print(f"  {k:24} {by_team[k]}")


if __name__ == "__main__":
    main()
