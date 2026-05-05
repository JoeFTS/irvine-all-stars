import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        db: { schema: "irvine_allstars" },
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SIGNUP_NOTIFY_TO = "allstars@irvinepony.com";

async function notifyParentSignup(opts: {
  parentName: string;
  parentEmail: string;
  childrenNames: string[];
}) {
  if (!resend || !supabase) return;
  try {
    const { data: regs } = await supabase
      .from("tryout_registrations")
      .select("player_first_name, player_last_name, division, team_id, teams:team_id(team_name)")
      .or(
        `parent_email.eq.${opts.parentEmail.toLowerCase()},secondary_parent_email.eq.${opts.parentEmail.toLowerCase()}`
      );

    type RegRow = { player_first_name: string; player_last_name: string; division: string | null; team_id: string | null; teams: { team_name: string } | { team_name: string }[] | null };
    const regRows = (regs ?? []) as RegRow[];
    const teamLines = regRows.map((row) => {
      const teamObj = Array.isArray(row.teams) ? row.teams[0] : row.teams;
      const team = teamObj?.team_name ?? row.division ?? "(no team)";
      return `${row.player_first_name} ${row.player_last_name} — ${team}`;
    });
    const childrenList = teamLines.length > 0 ? teamLines.join("\n") : opts.childrenNames.join(", ");

    // Team progress: for each unique team this parent's children are on, how many
    // total players and how many have at least one parent who has signed up.
    const teamIds = Array.from(
      new Set(regRows.map((r) => r.team_id).filter((id): id is string => Boolean(id)))
    );
    const progressLines: string[] = [];
    if (teamIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("email")
        .eq("role", "parent");
      const signedUpEmails = new Set(
        (profileRows ?? []).map((p) => (p.email || "").toLowerCase()).filter(Boolean)
      );

      const { data: teamRegs } = await supabase
        .from("tryout_registrations")
        .select("team_id, parent_email, secondary_parent_email, teams:team_id(team_name)")
        .in("team_id", teamIds);

      type TeamReg = { team_id: string; parent_email: string | null; secondary_parent_email: string | null; teams: { team_name: string } | { team_name: string }[] | null };
      const byTeam = new Map<string, { name: string; total: number; signedUp: number }>();
      for (const tr of (teamRegs ?? []) as TeamReg[]) {
        const teamObj = Array.isArray(tr.teams) ? tr.teams[0] : tr.teams;
        const name = teamObj?.team_name ?? "(unnamed team)";
        const entry = byTeam.get(tr.team_id) ?? { name, total: 0, signedUp: 0 };
        entry.total += 1;
        const primary = (tr.parent_email || "").toLowerCase();
        const secondary = (tr.secondary_parent_email || "").toLowerCase();
        if ((primary && signedUpEmails.has(primary)) || (secondary && signedUpEmails.has(secondary))) {
          entry.signedUp += 1;
        }
        byTeam.set(tr.team_id, entry);
      }

      for (const { name, total, signedUp } of byTeam.values()) {
        const remaining = total - signedUp;
        progressLines.push(`${name} — ${signedUp} of ${total} signed up (${remaining} left)`);
      }
    }
    const progressBlock = progressLines.length > 0
      ? `<p style="margin:18px 0 6px;color:#4B5563;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Team progress</p>
<pre style="margin:0;padding:12px;background:#F5F1EB;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;white-space:pre-wrap;">${progressLines.join("\n")}</pre>`
      : "";

    const childrenLabel = opts.childrenNames.length === 1 ? "child" : "children";
    const subject = `Parent signed up: ${opts.parentName} (${opts.childrenNames.join(", ")})`;
    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFF;border:1px solid #E5E7EB;border-radius:8px;">
<tr><td style="background:#0A2342;padding:18px 24px;color:#FFF;">
<p style="margin:0;font-size:11px;letter-spacing:2px;color:#F4B400;text-transform:uppercase;">Irvine All-Stars · Signup Alert</p>
<h1 style="margin:6px 0 0;font-size:18px;font-weight:700;">Parent activated their account</h1>
</td></tr>
<tr><td style="padding:20px 24px;color:#1C1C1C;font-size:14px;line-height:1.6;">
<p style="margin:0 0 12px;"><strong>${opts.parentName}</strong> (${opts.parentEmail}) signed up for the parent portal.</p>
<p style="margin:0 0 6px;color:#4B5563;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${childrenLabel}</p>
<pre style="margin:0;padding:12px;background:#F5F1EB;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;white-space:pre-wrap;">${childrenList}</pre>
${progressBlock}
<p style="margin:18px 0 0;color:#9CA3AF;font-size:12px;">Sent automatically by the parent portal.</p>
</td></tr>
</table></td></tr></table></body></html>`;

    await resend.emails.send({
      from: "Irvine All-Stars <AllStars@irvineallstars.com>",
      to: [SIGNUP_NOTIFY_TO],
      subject,
      html,
      replyTo: SIGNUP_NOTIFY_TO,
    });
  } catch (err) {
    console.error("notifyParentSignup error:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { token, userId, name } = await request.json();
    if (!token || !userId || !name) {
      return NextResponse.json({ error: "Missing token, userId, or name" }, { status: 400 });
    }

    const { data: invite, error: inviteErr } = await supabase
      .from("invites")
      .select("id, email, role, division, parent_name, child_first_name, child_last_name, current_team, used, expires_at, team_id")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }
    if (invite.used) {
      return NextResponse.json({ error: "Invite already used" }, { status: 409 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    const inviteEmail: string = invite.email;

    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email: inviteEmail,
        full_name: name,
        role: invite.role,
        division: invite.division || null,
      }, { onConflict: "id" });

    if (profileErr) {
      console.error("Profile upsert error:", profileErr);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    // If this is a coach invite pre-assigned to a team, link them in team_coaches.
    // Done BEFORE marking the invite used so a failure here leaves the invite
    // re-usable on retry instead of stranding the user with a consumed token.
    if (invite.role === "coach" && invite.team_id) {
      const { error: tcErr } = await supabase
        .from("team_coaches")
        .upsert(
          { team_id: invite.team_id, coach_id: userId, role: "head" },
          { onConflict: "team_id,coach_id" }
        );
      if (tcErr) {
        console.error("team_coaches insert error:", tcErr);
        // Leave the invite unused so the coach can retry without being stranded
        // with a consumed token and no team assignment.
        return NextResponse.json(
          { error: "Failed to assign coach to team. Please try again." },
          { status: 500 }
        );
      }
    }

    await supabase.from("invites").update({ used: true }).eq("token", token);

    const childrenNames: string[] = [];

    async function processParentInvite(p: {
      child_first_name: string | null;
      child_last_name: string | null;
      division: string | null;
      current_team: string | null;
    }) {
      if (!p.child_first_name || !p.child_last_name) return;
      const first = p.child_first_name.trim();
      const last = p.child_last_name.trim();

      const { data: existingReg } = await supabase!
        .from("tryout_registrations")
        .select("id, secondary_parent_email")
        .ilike("player_first_name", first)
        .ilike("player_last_name", last)
        .maybeSingle();

      if (existingReg) {
        if (!existingReg.secondary_parent_email) {
          await supabase!
            .from("tryout_registrations")
            .update({ secondary_parent_email: inviteEmail })
            .eq("id", existingReg.id);
        }
      } else {
        const regData: Record<string, string> = {
          parent_name: name,
          parent_email: inviteEmail.toLowerCase(),
          player_first_name: first,
          player_last_name: last,
          division: p.division || "",
          status: "registered",
        };
        if (p.current_team) regData.current_team = p.current_team;
        await supabase!.from("tryout_registrations").insert(regData);
      }
      childrenNames.push(first);
    }

    if (invite.role === "parent") {
      await processParentInvite(invite);
    }

    const { data: siblingInvites } = await supabase
      .from("invites")
      .select("id, child_first_name, child_last_name, division, current_team")
      .eq("email", inviteEmail)
      .eq("role", "parent")
      .eq("used", false);

    if (siblingInvites) {
      for (const sib of siblingInvites) {
        await processParentInvite(sib);
        await supabase.from("invites").update({ used: true }).eq("id", sib.id);
      }
    }

    if (invite.role === "parent") {
      void notifyParentSignup({
        parentName: name,
        parentEmail: inviteEmail,
        childrenNames,
      });
    }

    return NextResponse.json({ success: true, children: childrenNames });
  } catch (err) {
    console.error("complete-signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
