"""Send branded parent invites for a single team.

Uses CSV roster (Team Name field) — sends to Account Email primary plus any
distinct secondary emails. Multi-kid parents get ONE email with children grouped.

Modes:
  default            insert new invites + send emails
  --resend           skip insert, look up existing unused tokens, re-send email
  --dry-run          print plan, no DB writes / sends
  --preview-to E     filter recipients to just E (use for QA preview)

Usage:
  python3 scripts/invite_parents.py --team "12u Hernandez" --division "12U-Bronco" [--dry-run]
  python3 scripts/invite_parents.py --team "6u Juarigue" --division "6U-Shetland"
  python3 scripts/invite_parents.py --team "6u Judy"     --division "6U-Shetland"
  python3 scripts/invite_parents.py --team "12u Hernandez" --division "12U-Bronco" --resend --preview-to thesupplycomp@gmail.com
"""
import argparse
import csv
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path("/Users/joe/irvine-all-stars")
ENV_FILE = ROOT / ".env.local"
CSV_PATH = ROOT / ".playwright-mcp/unnamed-report.csv"
SUPA_REF = "owuempqaheupjyslkjlg"
SUPA_TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]


def load_env(path):
    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = load_env(ENV_FILE)
RESEND_KEY = ENV["RESEND_API_KEY"]


# csv_team → (coach_name, team_label). Mirrors TEAM_MAP in build_allstars_workbook.py.
TEAM_INFO = {
    "5u Negrete":       ("Jose Negrete",                "Shetland 5U"),
    "6u Juarigue":      ("Elvin Jaurigue",              "Shetland 6U Red"),
    "6u Judy":          ("Chad Judy",                   "Shetland 6U Blue"),
    "7u MP Singer":     ("Daniel Singer",               "Pinto MP 7U Red"),
    "8u MP Hay":        ("Brandon Hay",                 "Pinto MP 8U Red"),
    "8u MP Seto/White": ("KC White & Kevin Seto",       "Pinto MP 8U Blue"),
    "8u KP Watts":      ("Randy Watts",                 "Pinto KP 8U White"),
    "9u Bernal":        ("Carlos Bernal",               "Mustang 9U Gray"),
    "9u Grifka":        ("Carl Grifka",                 "Mustang 9U Navy"),
    "9u Hopp":          ("Matt Hopp",                   "Mustang 9U White"),
    "10u Kincade":      ("Ty Kincade",                  "Mustang 10U White"),
    "10u Stites":       ("Robbin Stites & Andy Yang",   "Mustang 10U Gray"),
    "11u Frisch":       ("Dustin Frisch",               "Bronco 11U Red"),
    "12u Hernandez":    ("Joe Hernandez",               "Bronco 12U Red"),
    "12u Sobel/Bailon": ("Ivan Bailon",                 "Bronco 12U Blue"),
}


def collect_emails(r):
    cands = [r.get("Account Email", ""), r.get("Email", ""), r.get("Email_cp1", ""), r.get("Secondary Email", "")]
    seen, out = set(), []
    for e in cands:
        e = (e or "").strip().lower()
        if not e or "@" not in e:
            continue
        if e in seen:
            continue
        seen.add(e)
        out.append(e)
    return out


def load_rows(team_filter):
    out = []
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            cleaned = {k.replace("\\uFEFF", "").replace("﻿", "").strip(): (v or "").strip() for k, v in r.items()}
            if cleaned.get("Team Name", "") == team_filter:
                out.append(cleaned)
    return out


def parent_invite_html(token, children, coach_name, team_label):
    """Branded parent invite — confirms child is ON coach's team, prompts portal login."""
    cta = f"https://irvineallstars.com/auth/invite/{token}"
    greeting = "Welcome, All-Stars Family!"
    names = [f"{c['first']} {c['last']}" for c in children]
    if len(names) == 1:
        name_str = names[0]
    elif len(names) == 2:
        name_str = f"{names[0]} and {names[1]}"
    else:
        name_str = ", ".join(names[:-1]) + ", and " + names[-1]
    plural_child = "children" if len(children) > 1 else "child"
    plural_are = "are" if len(children) > 1 else "is"
    child_line = (
        f'<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">'
        f"Your {plural_child} <strong>{name_str}</strong> {plural_are} on "
        f"<strong>{coach_name}</strong>&#39;s <strong>{team_label}</strong> team. "
        f"Log in to set up your parent profile and stay connected with the team throughout the season."
        f"</p>"
    )
    return f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A2342;padding:30px 40px;text-align:center;">
<p style="color:#F4B400;font-size:14px;margin:0 0 8px 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
<h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase;">Irvine All-Stars</h1>
<p style="color:#F4B400;font-size:14px;margin:8px 0 0 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
</td></tr>
<tr><td style="background-color:#C1121F;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="background-color:#FFFFFF;padding:40px;">
<h2 style="color:#0A2342;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">{greeting}</h2>
{child_line}<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EB;border-radius:8px;margin:0 0 24px 0;">
<tr><td style="padding:24px;">
<h3 style="color:#1C1C1C;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Through The Portal You Can</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Upload your child&#39;s birth certificate (with state seal, or a US passport)</td></tr>
</table></td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;" width="100%">
<tr><td align="center">
<a href="{cta}" style="display:inline-block;background-color:#C1121F;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Set Up Your Account</a>
</td></tr></table>
<p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:0 0 24px 0;text-align:center;">This link expires in 7 days and can only be used once.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong style="color:#0A2342;">Irvine Pony Baseball All-Stars</strong><br><a href="mailto:AllStars@irvinepony.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvinepony.com</a></p>
</td></tr>
<tr><td style="background-color:#0A2342;padding:20px 40px;text-align:center;">
<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">Irvine Pony Baseball &bull; 2026 All-Stars Season<br><a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a></p>
</td></tr>
</table></td></tr></table></body></html>'''


def supa_sql(sql):
    for attempt in range(4):
        req = Request(
            f"https://api.supabase.com/v1/projects/{SUPA_REF}/database/query",
            data=json.dumps({"query": sql}).encode(),
            headers={"Authorization": f"Bearer {SUPA_TOKEN}", "Content-Type": "application/json", "User-Agent": "curl/8.7.1"},
            method="POST",
        )
        try:
            with urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode() or "[]")
        except HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(2 ** attempt * 5)
                continue
            body = e.read().decode()
            raise RuntimeError(f"Supabase HTTP {e.code}: {body}")


def sql_quote(s):
    return s.replace("'", "''")


def insert_invite_for_child(parent_email, division, first, last):
    sql = (
        "INSERT INTO irvine_allstars.invites (email, role, division, child_first_name, child_last_name) "
        f"VALUES ('{sql_quote(parent_email)}', 'parent', '{sql_quote(division)}', "
        f"'{sql_quote(first)}', '{sql_quote(last)}') RETURNING token;"
    )
    res = supa_sql(sql)
    return res[0]["token"]


def lookup_existing_token(parent_email, first, last):
    """Find most recent unused parent invite token for (email, child)."""
    sql = (
        "SELECT token FROM irvine_allstars.invites "
        f"WHERE LOWER(email)=LOWER('{sql_quote(parent_email)}') "
        f"AND child_first_name='{sql_quote(first)}' "
        f"AND child_last_name='{sql_quote(last)}' "
        "AND role='parent' AND used=false "
        "ORDER BY created_at DESC LIMIT 1;"
    )
    res = supa_sql(sql)
    return res[0]["token"] if res else None


def send_email(to_email, subject, html):
    payload = {
        "from": "Irvine All-Stars <AllStars@irvineallstars.com>",
        "reply_to": "AllStars@irvinepony.com",
        "to": [to_email],
        "subject": subject,
        "html": html,
    }
    req = Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json", "User-Agent": "curl/8.7.1"},
        method="POST",
    )
    for attempt in range(4):
        try:
            with urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(2 ** attempt * 5)
                continue
            body = e.read().decode()
            raise RuntimeError(f"Resend HTTP {e.code}: {body}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--team", required=True, help="Team Name CSV value (e.g. '12u Hernandez')")
    ap.add_argument("--division", required=True, help="Division code (e.g. '12U-Bronco')")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resend", action="store_true", help="Reuse existing tokens, no DB inserts")
    ap.add_argument("--preview-to", help="Send only to this address (must be in target list)")
    args = ap.parse_args()

    info = TEAM_INFO.get(args.team)
    if not info:
        print(f"ERROR no TEAM_INFO entry for team={args.team!r}")
        sys.exit(1)
    coach_name, team_label = info

    rows = load_rows(args.team)
    if not rows:
        print(f"No rows for team={args.team!r}")
        sys.exit(1)

    by_primary = defaultdict(list)
    secondaries = defaultdict(set)
    for r in rows:
        emails = collect_emails(r)
        if not emails:
            print(f"WARN no email: {r.get('First Name')} {r.get('Last Name')} — skipping")
            continue
        primary = emails[0]
        by_primary[primary].append((r["First Name"], r["Last Name"]))
        for e in emails[1:]:
            secondaries[primary].add(e)

    targets = []
    for primary, kids in by_primary.items():
        targets.append((primary, kids))
        for sec in sorted(secondaries[primary]):
            targets.append((sec, kids))

    if args.preview_to:
        wanted = args.preview_to.lower()
        targets = [t for t in targets if t[0].lower() == wanted]
        if not targets:
            print(f"ERROR preview-to {args.preview_to!r} not in target list")
            sys.exit(1)

    mode = "DRY RUN — " if args.dry_run else ("RESEND — " if args.resend else "")
    print(f"\n{mode}Team {args.team!r} → {coach_name}'s {team_label} ({args.division})")
    print(f"  Players: {sum(len(k) for k in by_primary.values())}")
    print(f"  Unique primaries: {len(by_primary)}")
    print(f"  Sends in this run: {len(targets)}")
    for to_email, kids in targets:
        names = ", ".join(f"{f} {l}" for f, l in kids)
        print(f"    -> {to_email}  ({names})")

    if args.dry_run:
        print("\n(dry run — nothing sent)")
        return

    print("\nSending...")
    for to_email, kids in targets:
        children_payload = [{"first": f, "last": l, "division": args.division} for f, l in kids]
        first_token = None
        if args.resend:
            for first, last in kids:
                tok = lookup_existing_token(to_email, first, last)
                if tok is None:
                    print(f"  SKIP {to_email} ({first} {last}) — no existing unused token")
                    break
                if first_token is None:
                    first_token = tok
            if first_token is None:
                continue
        else:
            for first, last in kids:
                tok = insert_invite_for_child(to_email, args.division, first, last)
                if first_token is None:
                    first_token = tok
                time.sleep(0.6)
        html = parent_invite_html(first_token, children_payload, coach_name, team_label)
        send_email(to_email, "Welcome to Irvine All-Stars — Parent Portal Access", html)
        names = ", ".join(f"{f} {l}" for f, l in kids)
        print(f"  ok -> {to_email} ({names}) token={first_token[:8]}...")
        time.sleep(0.6)
    print("\nDone.")


if __name__ == "__main__":
    main()
