"""Verify every SE registration is loaded to correct coach team in Supabase."""
import csv
import json
import os
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

CSV_PATH = Path("/Users/joe/irvine-all-stars/.playwright-mcp/unnamed-report.csv")
SUPA_REF = "owuempqaheupjyslkjlg"
SUPA_TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]

EXPECTED = {
    "5u Negrete":        ("88c93e80-7e07-4e6a-8e85-86a9ed629959", "Shetland 5U"),
    "6u Juarigue":       ("d139e811-ee1f-4f03-adea-b603bff7281b", "Shetland 6U Red"),
    "6u Judy":           ("d8b1af7b-e4fe-4f24-8ef9-0ee95b261769", "Shetland 6U Blue"),
    "7u MP Singer":      ("dcf95474-f3d1-4da4-85c6-2414b52ca162", "Pinto MP 7U Red"),
    "8u MP Hay":         ("33fd6261-13d2-4b88-ad8d-018d8a9d7e4c", "Pinto MP 8U Red"),
    "8u MP Seto/White":  ("67773a97-7d6b-4683-af93-83d42461f314", "Pinto MP 8U Blue"),
    "8u KP Watts":       ("4fb96b55-b76b-4fa0-9fad-d25395c49e1e", "Pinto KP 8U White"),
    "9u Bernal":         ("d3515125-f16b-4c21-a1d2-330a750ec05e", "Mustang 9U Gray"),
    "9u Grifka":         ("3138c86b-1223-49f9-ab74-c1108260b961", "Mustang 9U Navy"),
    "9u Hopp":           ("dc626a84-a58d-4383-8a35-2e0d53963b0e", "Mustang 9U White"),
    "10u Kincade":       ("de43c2eb-88cb-4d99-b4a2-d8f93a4db213", "Mustang 10U White"),
    "10u Stites":        ("5341084b-dedc-47aa-8550-d6d46db51208", "Mustang 10U Gray"),
    "11u Frisch":        ("f4180f2d-d02d-4d54-aa13-cb31ea6c3584", "Bronco 11U Red"),
    "12u Hernandez":     ("c72e4613-7e30-4113-995e-5e0e3135e140", "Bronco 12U Red"),
    "12u Sobel/Bailon":  ("437577e6-29f7-484e-b524-63c0985cf37f", "Bronco 12U Blue"),
}


def supa_sql(sql):
    for attempt in range(4):
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
            if e.code == 429 and attempt < 3:
                time.sleep(2 ** attempt * 5)
                continue
            raise


def load_csv():
    rows = []
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            cleaned = {k.replace("\\uFEFF","").replace("﻿","").strip(): (v or "").strip() for k, v in r.items()}
            rows.append(cleaned)
    return rows


def parse_dob(s):
    try:
        return datetime.strptime(s.strip(), "%m/%d/%Y").date().isoformat()
    except Exception:
        return None


def main():
    rows = load_csv()
    print(f"Verifying {len(rows)} SE registrations against Supabase...\n")

    # Pull all tryout_registrations once
    all_db = supa_sql(
        "SELECT player_first_name, player_last_name, player_date_of_birth, parent_email, team_id "
        "FROM irvine_allstars.tryout_registrations;"
    )
    by_key = {}
    for r in all_db:
        k = (
            (r["player_first_name"] or "").lower().strip(),
            (r["player_last_name"] or "").lower().strip(),
            r["player_date_of_birth"] or "",
        )
        by_key.setdefault(k, []).append(r)

    missing, wrong_team, ok = [], [], 0
    for r in rows:
        team_name = r.get("Team Name", "")
        expected_team_id, expected_label = EXPECTED.get(team_name, (None, "?"))
        k = (r["First Name"].lower().strip(), r["Last Name"].lower().strip(), parse_dob(r["Date of Birth"]) or "")
        matches = by_key.get(k, [])
        if not matches:
            missing.append((r["First Name"], r["Last Name"], r["Date of Birth"], team_name))
            continue
        match_team_ids = [m["team_id"] for m in matches]
        if expected_team_id in match_team_ids:
            ok += 1
        else:
            wrong_team.append((
                r["First Name"], r["Last Name"], expected_label, expected_team_id,
                match_team_ids,
            ))

    print(f"OK (correct team):    {ok} / {len(rows)}")
    print(f"Missing in DB:        {len(missing)}")
    print(f"Wrong team_id:        {len(wrong_team)}")

    if missing:
        print("\nMISSING:")
        for m in missing:
            print(f"  - {m[0]} {m[1]} (DOB {m[2]}, parent-declared team: {m[3]})")
    if wrong_team:
        print("\nWRONG TEAM:")
        for w in wrong_team:
            print(f"  - {w[0]} {w[1]} | expected {w[2]} ({w[3][:8]}...) | actual team_ids: {w[4]}")


if __name__ == "__main__":
    main()
