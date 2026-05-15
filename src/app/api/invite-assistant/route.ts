import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        db: { schema: "irvine_allstars" },
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

function buildAssistantInviteHtml(token: string, assistantName: string, teamLabel: string, division: string, headCoachName: string | null) {
  const cta = `https://irvineallstars.com/auth/invite/${token}`;
  const greeting = assistantName ? `Hi ${assistantName},` : "Hi,";
  const fromLine = headCoachName ? `${headCoachName} has added you` : "You've been added";
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background-color:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
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
<h2 style="color:#0A2342;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">You're an Assistant Coach</h2>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">${greeting}</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">${fromLine} as an assistant coach for <strong>${teamLabel}</strong> (${division}) in the Irvine PONY All-Stars program. Set up your account to access the coach portal: view the roster, upload signed player contracts and birth certificates, manage certifications, and help run tournament prep.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EB;border-radius:8px;margin:0 0 24px 0;">
<tr><td style="padding:24px;">
<h3 style="color:#1C1C1C;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Your Portal Gives You Access To</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Player roster with contract &amp; birth certificate uploads</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Binder compliance checklist</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Certification uploads (Concussion &amp; Cardiac Arrest)</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Pre-tournament rules &amp; agreements</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Tournament updates &amp; announcements</td></tr>
</table></td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;" width="100%">
<tr><td align="center">
<a href="${cta}" style="display:inline-block;background-color:#C1121F;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Set Up Your Account</a>
</td></tr></table>
<p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:0 0 24px 0;text-align:center;">This link expires in 7 days and can only be used once.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong style="color:#0A2342;">Irvine Pony Baseball All-Stars</strong><br><a href="mailto:AllStars@irvinepony.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvinepony.com</a></p>
</td></tr>
<tr><td style="background-color:#0A2342;padding:20px 40px;text-align:center;">
<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">Irvine Pony Baseball &bull; 2026 All-Stars Season<br><a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    if (!resend) {
      return NextResponse.json({ error: "Email not configured" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "");
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const requesterEmail = user.email.toLowerCase();
    const requesterId = user.id;

    const body = await request.json();
    const { teamId, assistantEmail, assistantName } = body as {
      teamId?: string;
      assistantEmail?: string;
      assistantName?: string;
    };
    if (!teamId || !assistantEmail) {
      return NextResponse.json({ error: "teamId and assistantEmail are required" }, { status: 400 });
    }
    const targetEmail = assistantEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (targetEmail === requesterEmail) {
      return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
    }

    // Requester must be an existing coach (head or assistant) of this team, or admin.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", requesterId)
      .maybeSingle();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: tc } = await supabase
        .from("team_coaches")
        .select("role")
        .eq("team_id", teamId)
        .eq("coach_id", requesterId)
        .maybeSingle();
      if (!tc) {
        return NextResponse.json({ error: "You don't have access to this team" }, { status: 403 });
      }
    }

    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("team_name, division")
      .eq("id", teamId)
      .single();
    if (teamErr || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Already a coach on this team?
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", targetEmail)
      .maybeSingle();
    if (existingProfile) {
      const { data: existingTc } = await supabase
        .from("team_coaches")
        .select("role")
        .eq("team_id", teamId)
        .eq("coach_id", existingProfile.id)
        .maybeSingle();
      if (existingTc) {
        return NextResponse.json({ status: "already_on_team", role: existingTc.role });
      }
      // They have an account, just link them.
      const { error: linkErr } = await supabase
        .from("team_coaches")
        .insert({ team_id: teamId, coach_id: existingProfile.id, role: "assistant" });
      if (linkErr) {
        return NextResponse.json({ error: "Failed to add assistant" }, { status: 500 });
      }
      return NextResponse.json({ status: "linked_existing", to: targetEmail });
    }

    // Reuse a valid unused invite for this email+team, or create one.
    const nowIso = new Date().toISOString();
    const { data: validInvite } = await supabase
      .from("invites")
      .select("token")
      .eq("email", targetEmail)
      .eq("team_id", teamId)
      .eq("team_role", "assistant")
      .eq("used", false)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let token = validInvite?.token as string | undefined;
    if (!token) {
      const insertPayload: Record<string, string> = {
        email: targetEmail,
        role: "coach",
        team_id: teamId,
        team_role: "assistant",
        division: team.division || "",
      };
      if (assistantName) insertPayload.parent_name = assistantName.trim();
      const { data: newInvite, error: insertErr } = await supabase
        .from("invites")
        .insert(insertPayload)
        .select("token")
        .single();
      if (insertErr || !newInvite) {
        return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
      }
      token = newInvite.token as string;
    }

    const html = buildAssistantInviteHtml(
      token,
      assistantName?.trim() || "",
      team.team_name as string,
      team.division as string,
      profile?.full_name || null,
    );

    const { error: emailError } = await resend.emails.send({
      from: "Irvine All-Stars <AllStars@irvineallstars.com>",
      replyTo: "AllStars@irvinepony.com",
      to: [targetEmail],
      subject: `You're an assistant coach for ${team.team_name}`,
      html,
    });
    if (emailError) {
      return NextResponse.json({ error: "Failed to send invite email" }, { status: 500 });
    }

    return NextResponse.json({ status: "sent", to: targetEmail });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
