import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function getCoachEmailHtml(name: string, division: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#002868;padding:30px 40px;text-align:center;">
<p style="color:#F59E0B;font-size:14px;margin:0 0 8px 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
<h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase;">Irvine All-Stars</h1>
<p style="color:#F59E0B;font-size:14px;margin:8px 0 0 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
</td></tr>
<tr><td style="background-color:#B22234;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="background-color:#FFFFFF;padding:40px;">
<h2 style="color:#002868;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">Application Received</h2>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Hi ${name},</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">Thank you for applying to coach the <strong style="color:#002868;">${division}</strong> All-Stars team for the 2026 season. We have received your application and it is now under review.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EB;border-radius:8px;margin:0 0 24px 0;">
<tr><td style="padding:24px;">
<h3 style="color:#1C1C1C;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">What Happens Next</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">The committee will review your application within 1-2 weeks.</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Background checks will be initiated.</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Top candidates will be invited for a brief interview.</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">You will be notified of the final decision via email.</td></tr>
</table></td></tr></table>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 8px 0;">If you have any questions, please don't hesitate to reach out.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong style="color:#002868;">Irvine Pony Baseball All-Stars</strong><br><a href="mailto:AllStars@irvinepony.com" style="color:#002868;text-decoration:underline;">AllStars@irvinepony.com</a></p>
</td></tr>
<tr><td style="background-color:#002868;padding:20px 40px;text-align:center;">
<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">Irvine Pony Baseball &bull; 2026 All-Stars Season<br><a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function getPlayerEmailHtml(name: string, playerName: string, division: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
<div style="background:#0A2342;padding:24px;text-align:center;">
<span style="color:#F4B400;font-size:18px;">&#9733; &#9733; &#9733;</span>
<div style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:2px;margin-top:8px;">IRVINE ALL-STARS</div>
<span style="color:#F4B400;font-size:18px;">&#9733; &#9733; &#9733;</span>
</div>
<div style="background:#C1121F;height:4px;"></div>
<div style="padding:32px 24px;background:#ffffff;">
<h2 style="color:#0A2342;font-size:22px;margin:0 0 16px;letter-spacing:1px;">REGISTRATION COMPLETE</h2>
<p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 8px;">Hi ${name},</p>
<p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 24px;">Thank you for registering <strong style="color:#0A2342;">${playerName}</strong> for ${division} tryouts. We're excited to have your family as part of the All-Stars program.</p>
<p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 24px;"><strong style="color:#0A2342;">We'll send you a separate email with your specific tryout time and location</strong> as the date gets closer. Keep an eye on your inbox and your Parent Portal for updates.</p>

<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:0 0 20px;">
<h3 style="color:#0A2342;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">What to Bring to Tryouts</h3>
<table cellpadding="0" cellspacing="0" style="width:100%;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Glove, bat, helmet, and cleats</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Baseball pants and your regular-season jersey</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Water bottle (plenty of water!)</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Arrive 15 minutes early for check-in</td></tr>
</table>
</div>

<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:0 0 24px;">
<h3 style="color:#0A2342;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Key Dates</h3>
<table cellpadding="0" cellspacing="0" style="width:100%;">
<tr><td style="padding:4px 0;color:#0A2342;font-size:14px;font-weight:700;width:80px;">March 27:</td><td style="padding:4px 0;color:#4B5563;font-size:14px;">All-Star coaches named</td></tr>
<tr><td style="padding:4px 0;color:#0A2342;font-size:14px;font-weight:700;">April 12:</td><td style="padding:4px 0;color:#4B5563;font-size:14px;">All-Star tryouts (all Bronco &amp; Pony divisions)</td></tr>
<tr><td style="padding:4px 0;color:#0A2342;font-size:14px;font-weight:700;">April 14:</td><td style="padding:4px 0;color:#4B5563;font-size:14px;">All-Star players notified</td></tr>
<tr><td style="padding:4px 0;color:#0A2342;font-size:14px;font-weight:700;">Late May:</td><td style="padding:4px 0;color:#4B5563;font-size:14px;">Tournament season begins</td></tr>
</table>
</div>

<div style="text-align:center;margin:24px 0;">
<a href="https://irvineallstars.com/portal" style="background:#C1121F;color:#ffffff;padding:14px 32px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:2px;border-radius:6px;display:inline-block;">VIEW PARENT PORTAL</a>
</div>

<p style="color:#9CA3AF;font-size:13px;line-height:1.5;">Questions? Contact us at <a href="mailto:AllStars@irvinepony.com" style="color:#0A2342;">AllStars@irvinepony.com</a></p>
</div>
<div style="background:#0A2342;padding:16px;text-align:center;">
<p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0;letter-spacing:1px;">IRVINE PONY ALL-STARS &bull; 2026</p>
</div>
</div>
</body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, email, division, playerName } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const subject =
      type === "coach"
        ? "Irvine All-Stars \u2014 Coach Application Received"
        : "Irvine All-Stars \u2014 Tryout Registration Received";

    const htmlContent =
      type === "coach"
        ? getCoachEmailHtml(name, division || "")
        : getPlayerEmailHtml(name, playerName || "", division || "");

    if (resend) {
      const { error } = await resend.emails.send({
        from: "Irvine All-Stars <AllStars@irvineallstars.com>",
        replyTo: "AllStars@irvinepony.com",
        to: [email],
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error("Resend error:", error);
        // Fall through — don't block the submission
      }
    } else {
      console.warn("RESEND_API_KEY not configured, email not sent");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    // Don't return error — email failure shouldn't block submission
    return NextResponse.json({ success: true, note: "Email may not have sent" });
  }
}
