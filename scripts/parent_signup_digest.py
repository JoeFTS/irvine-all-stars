"""Nightly parent-signup digest emailed to AllStars@irvinepony.com.

Compares parent emails on selected/alternate registrations against the
profiles table (which gets a row when a parent activates their invite).
Sends one email per run with: today's new signups, per-team progress,
and the still-missing parent list per team.

Run on the VPS via cron. Reads from .env.local in the parent dir.

Required env (loaded from .env.local):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  RESEND_API_KEY

Flags:
  --dry-run           print the email body, don't send
  --to EMAIL          override recipient (defaults to AllStars@irvinepony.com)
  --since-hours N     window for "new today" section (default 24)
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


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


HERE = Path(__file__).resolve().parent
ENV = {**os.environ, **load_env(HERE.parent / ".env.local")}

SUPA_URL = ENV.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SUPA_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY", "")
RESEND_KEY = ENV.get("RESEND_API_KEY", "")
DEFAULT_TO = "AllStars@irvinepony.com"

if not SUPA_URL or not SUPA_KEY or not RESEND_KEY:
    print("ERROR missing one of NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY", file=sys.stderr)
    sys.exit(1)


def supa_get(path: str) -> list[dict]:
    """GET against PostgREST. path is the table+query string."""
    url = f"{SUPA_URL}/rest/v1/{path}"
    req = Request(url, headers={
        "apikey": SUPA_KEY,
        "Authorization": f"Bearer {SUPA_KEY}",
        "Accept-Profile": "irvine_allstars",
        "Content-Type": "application/json",
    })
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode() or "[]")


def fetch_active_registrations() -> list[dict]:
    return supa_get(
        "tryout_registrations?status=in.(selected,alternate)"
        "&select=id,player_first_name,player_last_name,division,team_id,parent_email,secondary_parent_email,parent_name,teams:team_id(team_name)"
    )


def fetch_signed_up_emails() -> set[str]:
    profiles = supa_get("profiles?role=eq.parent&select=email,full_name,created_at")
    return {(p.get("email") or "").lower() for p in profiles if p.get("email")}


def fetch_recent_signups(since_hours: int) -> list[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=since_hours)).isoformat()
    return supa_get(
        f"profiles?role=eq.parent&created_at=gte.{quote(cutoff, safe='')}"
        "&select=email,full_name,created_at&order=created_at.desc"
    )


def build_team_progress(regs: list[dict], signed: set[str]) -> dict:
    """Group by team. For each team: total parent emails, signed-up, missing list."""
    teams: dict[str, dict] = {}
    for r in regs:
        team_obj = r.get("teams")
        if isinstance(team_obj, list):
            team_obj = team_obj[0] if team_obj else None
        team_name = (team_obj or {}).get("team_name") or f"({r.get('division') or 'unassigned'})"
        t = teams.setdefault(team_name, {"primaries": {}, "secondaries": {}})
        primary = (r.get("parent_email") or "").lower().strip()
        secondary = (r.get("secondary_parent_email") or "").lower().strip()
        player = f"{r.get('player_first_name','').strip()} {r.get('player_last_name','').strip()}".strip()
        if primary:
            t["primaries"].setdefault(primary, []).append(player)
        if secondary and secondary != primary:
            t["secondaries"].setdefault(secondary, []).append(player)

    out = []
    for team_name in sorted(teams.keys()):
        t = teams[team_name]
        all_emails = set(t["primaries"].keys()) | set(t["secondaries"].keys())
        signed_emails = {e for e in all_emails if e in signed}
        missing = sorted(all_emails - signed_emails)
        # for missing, attach a kid name for context
        missing_with_kids = []
        for e in missing:
            kids = t["primaries"].get(e) or t["secondaries"].get(e) or []
            label = f"{e}" if not kids else f"{e} ({', '.join(sorted(set(kids)))})"
            missing_with_kids.append(label)
        out.append({
            "team": team_name,
            "total": len(all_emails),
            "signed": len(signed_emails),
            "pct": round(100 * len(signed_emails) / len(all_emails)) if all_emails else 0,
            "missing": missing_with_kids,
        })
    return {"teams": out}


def render_html(progress: dict, recent: list[dict], since_hours: int) -> str:
    teams = progress["teams"]
    total_invited = sum(t["total"] for t in teams)
    total_signed = sum(t["signed"] for t in teams)
    overall_pct = round(100 * total_signed / total_invited) if total_invited else 0

    rows = []
    for t in teams:
        bar_color = "#16A34A" if t["pct"] == 100 else ("#F4B400" if t["pct"] >= 50 else "#C1121F")
        status = "DONE" if t["pct"] == 100 else f'{t["signed"]}/{t["total"]}'
        rows.append(
            f'<tr><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:13px;">{t["team"]}</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:13px;text-align:right;color:{bar_color};font-weight:700;">{status}</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:13px;text-align:right;color:{bar_color};font-weight:700;">{t["pct"]}%</td></tr>'
        )

    missing_blocks = []
    for t in teams:
        if not t["missing"] or t["pct"] == 100:
            continue
        items = "".join(f'<li style="margin:2px 0;">{m}</li>' for m in t["missing"])
        missing_blocks.append(
            f'<p style="margin:14px 0 4px;color:#1C1C1C;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">{t["team"]} ({t["signed"]}/{t["total"]})</p>'
            f'<ul style="margin:0;padding-left:20px;color:#4B5563;font-size:12px;line-height:1.5;">{items}</ul>'
        )

    if recent:
        recent_items = "".join(
            f'<li style="margin:2px 0;color:#4B5563;font-size:13px;">{r.get("full_name") or "(no name)"} &middot; {r.get("email")} &middot; <span style="color:#9CA3AF;">{r.get("created_at","")[:16].replace("T"," ")} UTC</span></li>'
            for r in recent
        )
        recent_html = f'<ul style="margin:0;padding-left:20px;">{recent_items}</ul>'
    else:
        recent_html = '<p style="margin:0;color:#9CA3AF;font-size:13px;">No new signups in the last {h} hours.</p>'.format(h=since_hours)

    return f'''<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFF;border:1px solid #E5E7EB;border-radius:8px;">
<tr><td style="background:#0A2342;padding:22px 28px;color:#FFF;">
<p style="margin:0;font-size:11px;letter-spacing:2px;color:#F4B400;text-transform:uppercase;">Irvine All-Stars · Parent Signup Digest</p>
<h1 style="margin:6px 0 0;font-size:20px;font-weight:700;">{total_signed} of {total_invited} parents signed up ({overall_pct}%)</h1>
</td></tr>
<tr><td style="padding:24px 28px;color:#1C1C1C;">
<h2 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#0A2342;">New in last {since_hours}h</h2>
{recent_html}
<h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#0A2342;">Per-team progress</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
<tr style="background:#F5F1EB;"><td style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#4B5563;">Team</td>
<td style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#4B5563;text-align:right;">Signed</td>
<td style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#4B5563;text-align:right;">%</td></tr>
{"".join(rows)}
</table>
<h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#0A2342;">Still missing</h2>
{"".join(missing_blocks) if missing_blocks else '<p style="margin:0;color:#16A34A;font-size:14px;font-weight:700;">All parents signed up across all teams.</p>'}
<p style="margin:24px 0 0;color:#9CA3AF;font-size:11px;border-top:1px solid #E5E7EB;padding-top:12px;">Generated {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")} UTC by parent_signup_digest.py.</p>
</td></tr>
</table></td></tr></table></body></html>'''


def send_email(to_email: str, subject: str, html: str) -> dict:
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
        headers={
            "Authorization": f"Bearer {RESEND_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        raise RuntimeError(f"Resend HTTP {e.code}: {e.read().decode()}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--to", default=DEFAULT_TO)
    ap.add_argument("--since-hours", type=int, default=24)
    args = ap.parse_args()

    regs = fetch_active_registrations()
    signed = fetch_signed_up_emails()
    recent = fetch_recent_signups(args.since_hours)
    progress = build_team_progress(regs, signed)

    total_invited = sum(t["total"] for t in progress["teams"])
    total_signed = sum(t["signed"] for t in progress["teams"])
    pct = round(100 * total_signed / total_invited) if total_invited else 0
    subject = f"Parent Signups: {total_signed}/{total_invited} ({pct}%) — {len(recent)} new in {args.since_hours}h"

    html = render_html(progress, recent, args.since_hours)

    if args.dry_run:
        print(f"Subject: {subject}")
        print(f"To: {args.to}")
        print(f"Teams: {len(progress['teams'])}, total invited: {total_invited}, signed: {total_signed}")
        print(f"Recent ({args.since_hours}h): {len(recent)}")
        for r in recent[:10]:
            print(f"  - {r.get('full_name')} {r.get('email')} {r.get('created_at')}")
        print("\n(dry run — email not sent)")
        return

    res = send_email(args.to, subject, html)
    print(f"Sent. Resend id: {res.get('id')}")


if __name__ == "__main__":
    main()
