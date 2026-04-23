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

function getCoachInviteHtml(token: string, division?: string) {
  const ctaUrl = `https://irvineallstars.com/auth/invite/${token}`;
  return `<!DOCTYPE html>
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
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">${division ? `You've been invited to coach the <strong>${division}</strong> division for the ` : `You've been invited to join the `}Irvine PONY All-Stars coaching portal. This is your gateway to managing your team's tournament preparation &mdash; from binder compliance and certifications to roster management and tournament rules.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">As a coach, you also have access to the <strong>Parent Portal</strong>. If your own child is trying out, you can register them there after you set up your account &mdash; no separate invite needed.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EB;border-radius:8px;margin:0 0 24px 0;">
<tr><td style="padding:24px;">
<h3 style="color:#1C1C1C;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Your Portal Gives You Access To</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Binder compliance checklist</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Player roster & document tracking</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Certification uploads (Concussion & Cardiac Arrest)</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Pre-tournament rules & agreements</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Tournament updates & announcements</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Parent Portal access to register your own player</td></tr>
</table></td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;" width="100%">
<tr><td align="center">
<a href="${ctaUrl}" style="display:inline-block;background-color:#C1121F;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Set Up Your Account</a>
</td></tr></table>
<p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:0 0 24px 0;text-align:center;">This link expires in 7 days and can only be used once.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong style="color:#0A2342;">Irvine Pony Baseball All-Stars</strong><br><a href="mailto:AllStars@irvinepony.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvinepony.com</a></p>
</td></tr>
<tr><td style="background-color:#0A2342;padding:20px 40px;text-align:center;">
<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">Irvine Pony Baseball &bull; 2026 All-Stars Season<br><a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function getParentInviteHtml(token: string, options?: { parent_name?: string; child_first_name?: string; child_last_name?: string; division?: string; children?: Array<{ child_first_name: string; child_last_name: string; division?: string }> }) {
  const ctaUrl = `https://irvineallstars.com/auth/invite/${token}`;
  const greeting = options?.parent_name ? `Welcome, ${options.parent_name}!` : "Welcome, All-Stars Family!";
  let childLine = "";
  if (options?.children && options.children.length > 0) {
    const names = options.children.map(c => `${c.child_first_name} ${c.child_last_name}`);
    const nameStr = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    const divisions = Array.from(new Set(options.children.map(c => c.division).filter(Boolean)));
    const divStr = divisions.length === 1 ? divisions[0]! : divisions.length > 0 ? divisions.join(" and ") : "Irvine PONY";
    childLine = `<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">Your ${options.children.length === 1 ? "child" : "children"} <strong>${nameStr}</strong> ${options.children.length === 1 ? "has" : "have"} been invited to try out for the <strong>${divStr}</strong> ${divisions.length <= 1 ? "division" : "divisions"} of the Irvine PONY All-Stars.</p>`;
  } else if (options?.child_first_name && options?.child_last_name) {
    childLine = `<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">Your child <strong>${options.child_first_name} ${options.child_last_name}</strong> has been invited to try out for the <strong>${options.division || "Irvine PONY"}</strong> division of the Irvine PONY All-Stars.</p>`;
  }
  return `<!DOCTYPE html>
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
<h2 style="color:#0A2342;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">${greeting}</h2>
${childLine}<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">You've been invited to access the Irvine PONY All-Stars parent portal. This portal helps you stay connected with the All-Stars program and manage your player's tournament requirements.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8E1;border-left:4px solid #F4B400;border-radius:4px;margin:0 0 24px 0;">
<tr><td style="padding:16px 20px;">
<p style="color:#4B5563;font-size:14px;line-height:1.6;margin:0;"><strong style="color:#0A2342;">Important:</strong> Receiving this invitation does not guarantee your player a spot on an All-Stars team. This portal is designed to facilitate communication between families and the league during the tryout and selection process.</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EB;border-radius:8px;margin:0 0 24px 0;">
<tr><td style="padding:24px;">
<h3 style="color:#1C1C1C;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Through The Portal You Can</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Upload required documents (birth certificate, player photo)</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Sign the digital player contract</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">View your player's registration status</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#C1121F;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Stay updated with announcements</td></tr>
</table></td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;" width="100%">
<tr><td align="center">
<a href="${ctaUrl}" style="display:inline-block;background-color:#C1121F;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Set Up Your Account</a>
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
    const body = await request.json();
    const { email, role, division, parent_name, child_first_name, child_last_name, children, current_team, team_id } = body;

    if (!email || !role || !["coach", "parent"].includes(role)) {
      return NextResponse.json(
        { error: "Missing or invalid required fields: email, role (coach | parent)" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Coach + parent flow: coach invite with children attached
    if (role === "coach" && Array.isArray(children) && children.length > 0) {
      // 1. Create the coach invite record
      const coachInsert: Record<string, string> = { email, role: "coach" };
      if (division) coachInsert.division = division;
      if (team_id) coachInsert.team_id = team_id;

      const { data: coachInvite, error: coachErr } = await supabase
        .from("invites")
        .insert(coachInsert)
        .select("id, token")
        .single();

      if (coachErr || !coachInvite) {
        console.error("Coach invite insert error:", coachErr);
        return NextResponse.json({ error: "Failed to create coach invite" }, { status: 500 });
      }

      // Auto-accept coach application
      await supabase
        .from("coach_applications")
        .update({ status: "accepted" })
        .eq("email", email)
        .in("status", ["submitted", "under_review"]);

      // 2. Create parent invite records for each child (picked up during signup)
      for (const child of children) {
        const childInsert: Record<string, string> = {
          email,
          role: "parent",
        };
        if (child.division) childInsert.division = child.division;
        if (child.child_first_name) childInsert.child_first_name = child.child_first_name;
        if (child.child_last_name) childInsert.child_last_name = child.child_last_name;
        if (child.current_team) childInsert.current_team = child.current_team;

        await supabase.from("invites").insert(childInsert);
      }

      // 3. Send ONE email mentioning both coach role and children
      const childNames = children
        .map((c) => `${c.child_first_name} ${c.child_last_name}`)
        .filter(Boolean);
      const childMention = childNames.length > 0
        ? ` We've also set up registrations for your ${childNames.length === 1 ? "child" : "children"}: <strong>${childNames.join(" and ")}</strong>. You'll have access to both the Coach Portal and Parent Portal with a single login.`
        : "";

      const coachHtml = getCoachInviteHtml(coachInvite.token, division).replace(
        "</p>\n</td></tr>\n</table>",
        `${childMention}</p>\n</td></tr>\n</table>`
      );

      if (resend) {
        const { error: emailError } = await resend.emails.send({
          from: "Irvine All-Stars <AllStars@irvineallstars.com>",
          replyTo: "AllStars@irvinepony.com",
          to: [email],
          subject: "Welcome to the Irvine All-Stars Coaching Portal",
          html: coachHtml,
        });
        if (emailError) {
          console.error("Resend error:", emailError);
          return NextResponse.json({ error: "Failed to send invite email" }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true, token: coachInvite.token });
    }

    // Multi-child flow: when children array is provided for parent invites
    if (role === "parent" && Array.isArray(children) && children.length > 0) {
      const results: Array<{ child: string; status: "created" | "duplicate" }> = [];
      let firstToken: string | null = null;

      for (const child of children) {
        const childName = `${child.child_first_name} ${child.child_last_name}`;

        // Check for existing active invite with same email + child
        const { data: existing } = await supabase
          .from("invites")
          .select("id")
          .eq("email", email)
          .eq("child_first_name", child.child_first_name)
          .eq("child_last_name", child.child_last_name)
          .eq("used", false)
          .maybeSingle();

        if (existing) {
          results.push({ child: childName, status: "duplicate" });
          continue;
        }

        // Create invite record for this child
        const insertData: Record<string, string> = { email, role };
        if (child.division) insertData.division = child.division;
        if (parent_name) insertData.parent_name = parent_name;
        if (child.child_first_name) insertData.child_first_name = child.child_first_name;
        if (child.child_last_name) insertData.child_last_name = child.child_last_name;
        if (child.current_team) insertData.current_team = child.current_team;

        const { data: invite, error: insertError } = await supabase
          .from("invites")
          .insert(insertData)
          .select("id, token")
          .single();

        if (insertError || !invite) {
          console.error("Supabase insert error for child:", childName, insertError);
          continue;
        }

        if (!firstToken) firstToken = invite.token;
        results.push({ child: childName, status: "created" });
      }

      // If no children were created (all duplicates or errors), return conflict
      if (!firstToken) {
        return NextResponse.json(
          { error: "duplicate", message: "All children already have active invites", results },
          { status: 409 }
        );
      }

      // Send ONE email mentioning all children
      const subject = "Welcome to Irvine All-Stars \u2014 Parent Portal Access";
      const htmlContent = getParentInviteHtml(firstToken, { parent_name, children });

      if (resend) {
        const { error: emailError } = await resend.emails.send({
          from: "Irvine All-Stars <AllStars@irvineallstars.com>",
          replyTo: "AllStars@irvinepony.com",
          to: [email],
          subject,
          html: htmlContent,
        });

        if (emailError) {
          console.error("Resend error:", emailError);
          return NextResponse.json(
            { error: "Failed to send invite email" },
            { status: 500 }
          );
        }
      } else {
        console.warn("RESEND_API_KEY not configured, invite email not sent");
      }

      return NextResponse.json({ success: true, results, token: firstToken });
    }

    // Single-child / legacy flow (backward compatible)

    // Check for existing active invite with same email + child
    if (child_first_name && child_last_name) {
      const { data: existing } = await supabase
        .from("invites")
        .select("id")
        .eq("email", email)
        .eq("child_first_name", child_first_name)
        .eq("child_last_name", child_last_name)
        .eq("used", false)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "duplicate", message: "Active invite already exists" },
          { status: 409 }
        );
      }
    }

    // Create invite record (token and expires_at are auto-generated by DB defaults)
    const insertData: Record<string, string> = { email, role };
    if (division) insertData.division = division;
    if (parent_name) insertData.parent_name = parent_name;
    if (child_first_name) insertData.child_first_name = child_first_name;
    if (child_last_name) insertData.child_last_name = child_last_name;
    if (current_team) insertData.current_team = current_team;
    if (team_id && role === "coach") insertData.team_id = team_id;

    const { data: invite, error: insertError } = await supabase
      .from("invites")
      .insert(insertData)
      .select("id, token")
      .single();

    if (insertError || !invite) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    const token = invite.token;

    // Auto-accept coach application when invite is sent
    if (role === "coach") {
      await supabase
        .from("coach_applications")
        .update({ status: "accepted" })
        .eq("email", email)
        .in("status", ["submitted", "under_review"]);
    }

    // Send branded invite email
    const subject =
      role === "coach"
        ? "Welcome to the Irvine All-Stars Coaching Portal"
        : "Welcome to Irvine All-Stars \u2014 Parent Portal Access";

    const htmlContent =
      role === "coach"
        ? getCoachInviteHtml(token, division)
        : getParentInviteHtml(token, { parent_name, child_first_name, child_last_name, division });

    if (resend) {
      const { error: emailError } = await resend.emails.send({
        from: "Irvine All-Stars <AllStars@irvineallstars.com>",
        replyTo: "AllStars@irvinepony.com",
        to: [email],
        subject,
        html: htmlContent,
      });

      if (emailError) {
        console.error("Resend error:", emailError);
        return NextResponse.json(
          { error: "Failed to send invite email" },
          { status: 500 }
        );
      }
    } else {
      console.warn("RESEND_API_KEY not configured, invite email not sent");
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
