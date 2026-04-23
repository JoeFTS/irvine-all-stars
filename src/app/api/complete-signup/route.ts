import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        db: { schema: "irvine_allstars" },
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

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

    await supabase.from("invites").update({ used: true }).eq("token", token);

    // If this is a coach invite pre-assigned to a team, link them in team_coaches.
    if (invite.role === "coach" && invite.team_id) {
      const { error: tcErr } = await supabase
        .from("team_coaches")
        .upsert(
          { team_id: invite.team_id, coach_id: userId, role: "head" },
          { onConflict: "team_id,coach_id" }
        );
      if (tcErr) console.error("team_coaches insert error:", tcErr);
      // Don't fail the signup — admin can fix via roster manager.
    }

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

    return NextResponse.json({ success: true, children: childrenNames });
  } catch (err) {
    console.error("complete-signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
