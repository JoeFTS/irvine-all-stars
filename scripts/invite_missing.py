"""One-off: invite parents (primary + secondary) for selected players who never
got a parent invite. Cross-references tryout_registrations vs invites and sends
the standard parent_invite_html template. Preview-first per project rule."""
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path("/Users/joe/irvine-all-stars")
sys.path.insert(0, str(ROOT / "scripts"))
from invite_parents import (
    insert_invite_for_child,
    parent_invite_html,
    send_email,
    supa_sql,
)

# team_name -> human coach label for email body
COACH_BY_TEAM = {
    "Shetland 5U":         "Jose Negrete",
    "Shetland 6U Red":     "Elvin Jaurigue",
    "Shetland 6U Blue":    "Chad Judy",
    "Pinto MP 7U Red":     "Daniel Singer",
    "Pinto MP 8U Red":     "Brandon Hay",
    "Pinto MP 8U Blue":    "KC White & Kevin Seto",
    "Pinto KP 8U White":   "Randy Watts",
    "Mustang 9U White":    "Matt Hopp",
    "Mustang 9U Gray":     "Carlos Bernal",
    "Mustang 9U Navy":     "Carl Grifka",
    "Mustang 10U White":   "Ty Kincade",
    "Mustang 10U Gray":    "Robbin Stites & Andy Yang",
    "Bronco 11U Red":      "Dustin Frisch",
    "Bronco 12U Red":      "Joe Hernandez",
    "Bronco 12U Blue":     "Ivan Bailon",
}


def collect_targets():
    """Return list of dicts: email, first, last, division, team_name, coach, kind."""
    regs = supa_sql(
        "SELECT tr.player_first_name, tr.player_last_name, tr.parent_email, "
        "tr.secondary_parent_email, tr.division, t.team_name "
        "FROM irvine_allstars.tryout_registrations tr "
        "JOIN irvine_allstars.teams t ON t.id = tr.team_id "
        "WHERE tr.status='selected' AND tr.team_id IS NOT NULL "
        "ORDER BY t.team_name, tr.player_last_name;"
    )
    invites = supa_sql(
        "SELECT LOWER(email) AS email, LOWER(child_first_name) AS first_name, "
        "LOWER(child_last_name) AS last_name FROM irvine_allstars.invites "
        "WHERE role='parent';"
    )
    have = {(i["email"], i["first_name"], i["last_name"]) for i in invites}
    out = []
    for r in regs:
        first = r["player_first_name"]
        last = r["player_last_name"]
        for kind, email in (("primary", r["parent_email"]), ("secondary", r["secondary_parent_email"])):
            if not email:
                continue
            if (email.lower(), first.lower(), last.lower()) in have:
                continue
            out.append({
                "email": email,
                "first": first,
                "last": last,
                "division": r["division"],
                "team_name": r["team_name"],
                "coach": COACH_BY_TEAM.get(r["team_name"], "Coach"),
                "kind": kind,
            })
    return out


def build_html(token, target):
    children = [{"first": target["first"], "last": target["last"], "division": target["division"]}]
    return parent_invite_html(token, children, target["coach"], target["team_name"])


def main():
    args = set(sys.argv[1:])
    preview = "--preview" in args
    send = "--send" in args
    if not (preview or send):
        print("Usage: invite_missing.py --preview | --send")
        sys.exit(1)

    targets = collect_targets()
    print(f"Found {len(targets)} missing-invite targets:")
    for t in targets:
        print(f"  {t['kind']:9} {t['team_name']:20} {t['first']} {t['last']:18} -> {t['email']}")

    if preview:
        if not targets:
            print("No targets — nothing to preview.")
            return
        sample = targets[0]
        # use a throwaway token bound to a fake email so preview doesn't burn a real invite
        token = insert_invite_for_child("preview@thesupplycomp.test", sample["division"], sample["first"], sample["last"])
        html = build_html(token, sample)
        send_email(
            "thesupplycomp@gmail.com",
            f"[PREVIEW] Missing-parent invite — {sample['team_name']} ({sample['first']} {sample['last']})",
            html,
        )
        print(f"\nPreview sent to thesupplycomp@gmail.com — sample: {sample['kind']} parent of {sample['first']} {sample['last']} on {sample['team_name']}")
        return

    print(f"\nFanning out to {len(targets)} recipients...")
    for t in targets:
        token = insert_invite_for_child(t["email"], t["division"], t["first"], t["last"])
        html = build_html(token, t)
        send_email(t["email"], "Welcome to Irvine All-Stars — Parent Portal Access", html)
        print(f"  ok {t['kind']:9} {t['team_name']:20} {t['first']} {t['last']:18} -> {t['email']} token={token[:8]}...")
        time.sleep(0.6)
    print("\nDone.")


if __name__ == "__main__":
    main()
