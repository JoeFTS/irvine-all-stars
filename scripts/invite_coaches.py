"""Send branded coach invites to 9 unsigned head coaches.
Inserts row in irvine_allstars.invites + sends email via Resend.
Mirrors logic of /api/send-invite/route.ts."""
import json
import os
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

ENV_FILE = Path("/Users/joe/irvine-all-stars/.env.local")
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


COACHES = [
    {"email": "jnegrete109@yahoo.com",       "team_id": "88c93e80-7e07-4e6a-8e85-86a9ed629959", "division": "5U-Shetland",   "team_label": "Shetland 5U"},
    {"email": "chadjudy@me.com",             "team_id": "d8b1af7b-e4fe-4f24-8ef9-0ee95b261769", "division": "6U-Shetland",   "team_label": "Shetland 6U Blue"},
    {"email": "daniel.singer@hotmail.com",   "team_id": "dcf95474-f3d1-4da4-85c6-2414b52ca162", "division": "7U MP-Pinto",   "team_label": "Pinto MP 7U Red"},
    {"email": "bhankhay@gmail.com",          "team_id": "33fd6261-13d2-4b88-ad8d-018d8a9d7e4c", "division": "8U MP-Pinto",   "team_label": "Pinto MP 8U Red"},
    {"email": "whiteke8@gmail.com",          "team_id": "67773a97-7d6b-4683-af93-83d42461f314", "division": "8U MP-Pinto",   "team_label": "Pinto MP 8U Blue"},
    {"email": "randywatts1983@yahoo.com",    "team_id": "4fb96b55-b76b-4fa0-9fad-d25395c49e1e", "division": "8U KP-Pinto",   "team_label": "Pinto KP 8U White"},
    {"email": "carl.grifka@gmail.com",       "team_id": "3138c86b-1223-49f9-ab74-c1108260b961", "division": "9U-Mustang",    "team_label": "Mustang 9U Navy"},
    # NOTE: Stale rows below — kept for historical record of past sends. Team labels
    # corrected to match current DB (team_name on referenced team_id). Do NOT re-run
    # without re-validating recipients against current teams.coach_email.
    {"email": "dmichaelbeck@gmail.com",      "team_id": "de43c2eb-88cb-4d99-b4a2-d8f93a4db213", "division": "10U-Mustang",   "team_label": "Mustang 10U White"},
    {"email": "coachjose58@yahoo.com",       "team_id": "1db27483-cb7e-41b9-ba02-41661c0879c4", "division": "13U-Pony",      "team_label": "Pony 13U Red"},
]


def coach_invite_html(token, division=None):
    cta = f"https://irvineallstars.com/auth/invite/{token}"
    div_text = (f"You've been invited to coach the <strong>{division}</strong> division for the "
                if division else "You've been invited to join the ")
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
<h2 style="color:#0A2342;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">Congratulations, Coach!</h2>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">{div_text}Irvine PONY All-Stars coaching portal. This is your gateway to managing your team's tournament preparation &mdash; from binder compliance and certifications to roster management and tournament rules.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">As a coach, you also have access to the <strong>Parent Portal</strong>. If your own child is trying out, you can register them there after you set up your account &mdash; no separate invite needed.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EB;border-radius:8px;margin:0 0 24px 0;">
<tr><td style="padding:24px;">
<h3 style="color:#1C1C1C;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Your Portal Gives You Access To</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Binder compliance checklist</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Player roster &amp; document tracking</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Certification uploads (Concussion &amp; Cardiac Arrest)</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Pre-tournament rules &amp; agreements</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Tournament updates &amp; announcements</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Parent Portal access to register your own player</td></tr>
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
    req = Request(
        f"https://api.supabase.com/v1/projects/{SUPA_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {SUPA_TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode() or "[]")


def insert_invite(email, division, team_id):
    sql = (
        "INSERT INTO irvine_allstars.invites (email, role, division, team_id) "
        f"VALUES ('{email}', 'coach', '{division}', '{team_id}') "
        "RETURNING token;"
    )
    res = supa_sql(sql)
    return res[0]["token"]


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
        headers={
            "Authorization": f"Bearer {RESEND_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "irvine-allstars-invite-script/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Resend HTTP {e.code}: {body}")


def main():
    dry = "--dry-run" in sys.argv
    print(f"{'DRY RUN — ' if dry else ''}Sending {len(COACHES)} coach invites...")
    for c in COACHES:
        print(f"  -> {c['team_label']:22} ({c['email']})")
        if dry:
            continue
        token = insert_invite(c["email"], c["division"], c["team_id"])
        send_email(
            c["email"],
            "Welcome to the Irvine All-Stars Coaching Portal",
            coach_invite_html(token, c["division"]),
        )
        print(f"     ok — token {token[:8]}...")
        time.sleep(0.3)  # gentle rate limit
    print("Done.")


if __name__ == "__main__":
    main()
