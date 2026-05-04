import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SITE_URL = "https://irvineallstars.com";

function getResetEmailHtml(actionLink: string) {
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
<h2 style="color:#0A2342;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">Reset Your Password</h2>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">We received a request to reset the password on your Irvine All-Stars account. Click the button below to choose a new password.</p>
<table cellpadding="0" cellspacing="0" style="margin:24px 0;" width="100%">
<tr><td align="center">
<a href="${actionLink}" style="display:inline-block;background-color:#C1121F;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Reset Password</a>
</td></tr></table>
<p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:0 0 16px 0;text-align:center;">This link expires in 1 hour and can only be used once.</p>
<p style="color:#4B5563;font-size:14px;line-height:1.6;margin:24px 0 0 0;">If you didn&apos;t request this, you can safely ignore this email. Your current password will stay the same.</p>
<p style="color:#4B5563;font-size:14px;line-height:1.6;margin:16px 0 0 0;">If the button above doesn&apos;t work, copy and paste this link into your browser:</p>
<p style="color:#0A2342;font-size:12px;line-height:1.5;margin:8px 0 0 0;word-break:break-all;"><a href="${actionLink}" style="color:#0A2342;">${actionLink}</a></p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:24px 0 0 0;">Best regards,<br><strong style="color:#0A2342;">Irvine Pony Baseball All-Stars</strong><br><a href="mailto:AllStars@irvinepony.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvinepony.com</a></p>
</td></tr>
<tr><td style="background-color:#0A2342;padding:20px 40px;text-align:center;">
<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">Irvine Pony Baseball &bull; 2026 All-Stars Season<br><a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const previewTo = typeof body.preview_to === "string" ? body.preview_to.trim() : "";

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = rawEmail.toLowerCase();
    const redirectTo = `${SITE_URL}/auth/reset-password`;

    let actionLink: string | null = null;
    try {
      const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "recovery", email, redirect_to: redirectTo }),
      });
      if (linkRes.ok) {
        const linkData = await linkRes.json();
        actionLink = linkData?.action_link || linkData?.properties?.action_link || null;
      }
    } catch (e) {
      console.error("generate_link fetch error:", e);
    }

    if (!actionLink) {
      // User doesn't exist or other error. Don't reveal which.
      return NextResponse.json({ success: true });
    }
    const recipient = previewTo || email;

    if (resend) {
      const { error: emailError } = await resend.emails.send({
        from: "Irvine All-Stars <AllStars@irvineallstars.com>",
        replyTo: "AllStars@irvinepony.com",
        to: [recipient],
        subject: previewTo
          ? `[PREVIEW] Reset your Irvine All-Stars password`
          : "Reset your Irvine All-Stars password",
        html: getResetEmailHtml(actionLink),
      });
      if (emailError) {
        console.error("Resend reset email error:", emailError);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }
    } else {
      console.warn("RESEND_API_KEY not configured, reset email not sent");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
