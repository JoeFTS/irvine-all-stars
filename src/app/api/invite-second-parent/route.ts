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

function buildInviteHtml(token: string, parentName: string, childName: string, teamLabel: string | null) {
  const cta = `https://irvineallstars.com/auth/invite/${token}`;
  const team = teamLabel ? ` (${teamLabel})` : "";
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background-color:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A2342;padding:30px 40px;text-align:center;">
<h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase;">Irvine All-Stars</h1>
</td></tr>
<tr><td style="background-color:#C1121F;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="background-color:#FFFFFF;padding:40px;">
<h2 style="color:#0A2342;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">You&apos;ve Been Added as a Parent</h2>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Hi${parentName ? ` ${parentName}` : ""},</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">You&apos;ve been added as a second parent / guardian for <strong>${childName}</strong>${team} in the Irvine PONY All-Stars program. Set up your account to access the parent portal: upload the birth certificate, complete the medical release, sign documents, and stay in the loop on tournament updates.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;" width="100%">
<tr><td align="center">
<a href="${cta}" style="display:inline-block;background-color:#C1121F;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Set Up Your Account</a>
</td></tr></table>
<p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:0 0 24px 0;text-align:center;">This link expires in 7 days and can only be used once.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;">Thanks,<br><strong style="color:#0A2342;">Irvine All-Stars</strong><br><a href="mailto:AllStars@irvinepony.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvinepony.com</a></p>
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

    // Auth: requester must be a signed-in parent.
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "");
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const requesterEmail = user.email.toLowerCase();

    const body = await request.json();
    const { regId } = body as { regId?: string };
    if (!regId) {
      return NextResponse.json({ error: "regId is required" }, { status: 400 });
    }

    // Load the registration. Requester must own it.
    const { data: reg, error: regErr } = await supabase
      .from("tryout_registrations")
      .select("id, parent_name, parent_email, secondary_parent_name, secondary_parent_email, player_first_name, player_last_name, division, team_id, current_team")
      .eq("id", regId)
      .single();
    if (regErr || !reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    const primary = (reg.parent_email || "").toLowerCase();
    const secondary = (reg.secondary_parent_email || "").toLowerCase();
    if (requesterEmail !== primary && requesterEmail !== secondary) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!secondary) {
      return NextResponse.json({ error: "No second parent email is set on this registration" }, { status: 400 });
    }
    if (secondary === primary) {
      return NextResponse.json({ error: "Second parent email matches primary" }, { status: 400 });
    }

    // If they already have a profile, nothing to do.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", secondary)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ status: "already_has_account" });
    }

    // Reuse any unused, unexpired invite for this email; otherwise create one.
    const nowIso = new Date().toISOString();
    const { data: validInvite } = await supabase
      .from("invites")
      .select("token")
      .eq("email", secondary)
      .eq("used", false)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let token = validInvite?.token as string | undefined;
    if (!token) {
      const insertPayload: Record<string, string> = {
        email: secondary,
        role: "parent",
      };
      if (reg.division) insertPayload.division = reg.division;
      if (reg.secondary_parent_name) insertPayload.parent_name = reg.secondary_parent_name;
      if (reg.player_first_name) insertPayload.child_first_name = reg.player_first_name;
      if (reg.player_last_name) insertPayload.child_last_name = reg.player_last_name;
      if (reg.current_team) insertPayload.current_team = reg.current_team;
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

    // Fetch team label for the email body (optional).
    let teamLabel: string | null = null;
    if (reg.team_id) {
      const { data: team } = await supabase
        .from("teams")
        .select("team_name")
        .eq("id", reg.team_id)
        .maybeSingle();
      teamLabel = team?.team_name || null;
    }

    const childName = `${reg.player_first_name || ""} ${reg.player_last_name || ""}`.trim();
    const html = buildInviteHtml(
      token,
      reg.secondary_parent_name || "",
      childName,
      teamLabel,
    );

    const { error: emailError } = await resend.emails.send({
      from: "Irvine All-Stars <AllStars@irvineallstars.com>",
      replyTo: "AllStars@irvinepony.com",
      to: [secondary],
      subject: "You've been added as a parent on Irvine All-Stars",
      html,
    });
    if (emailError) {
      return NextResponse.json({ error: "Failed to send invite email" }, { status: 500 });
    }

    return NextResponse.json({ status: "sent", to: secondary });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
