import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function getTryoutInviteHtml(
  parentName: string,
  playerName: string,
  division: string,
  sessionDate: string,
  startTime: string,
  endTime: string | null,
  location: string,
  field: string | null,
  isUpdated: boolean = false,
  registrationId: string = ""
) {
  // Format date
  const d = new Date(sessionDate + "T00:00:00");
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Format time
  function fmtTime(t: string) {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${ampm}`;
  }

  const timeStr = endTime
    ? `${fmtTime(startTime)} – ${fmtTime(endTime)}`
    : fmtTime(startTime);

  const locationStr = field ? `${location} — ${field}` : location;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;">
<div style="background:#0A2342;padding:24px;text-align:center;">
<span style="color:#F4B400;font-size:18px;">&#9733; &#9733; &#9733;</span>
<div style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:2px;margin-top:8px;">IRVINE ALL-STARS</div>
<span style="color:#F4B400;font-size:18px;">&#9733; &#9733; &#9733;</span>
</div>
<div style="background:#C1121F;height:4px;"></div>
<div style="padding:32px 24px;background:#ffffff;">
<h2 style="color:#0A2342;font-size:22px;margin:0 0 16px;letter-spacing:1px;">${isUpdated ? "UPDATED TRYOUT TIME" : "YOUR TRYOUT TIME"}</h2>
<p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 8px;">Hi ${parentName},</p>
${isUpdated
  ? `<p style="color:#C1121F;font-size:15px;line-height:1.6;margin:0 0 8px;font-weight:bold;">Please note: the tryout details for <strong style="color:#0A2342;">${playerName}</strong> have been updated. See the new information below.</p>`
  : ""}
<p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 24px;">${isUpdated ? `Here are the updated details for ${playerName}'s ${division} tryout:` : `We're excited to let you know that <strong style="color:#0A2342;">${playerName}</strong>'s tryout time has been scheduled for the ${division} division.`}</p>

<div style="background:#F0F4FF;border:2px solid #0A2342;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center;">
<p style="color:#0A2342;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Tryout Details</p>
<p style="color:#0A2342;font-size:20px;font-weight:bold;margin:0 0 4px;">${dateStr}</p>
<p style="color:#C1121F;font-size:18px;font-weight:bold;margin:0 0 12px;">${timeStr}</p>
<p style="color:#4B5563;font-size:15px;margin:0;">${locationStr}</p>
</div>

<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:0 0 20px;">
<h3 style="color:#0A2342;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Reminders</h3>
<table cellpadding="0" cellspacing="0" style="width:100%;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Bring glove, bat, helmet, and cleats</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Wear baseball pants and regular-season jersey</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Bring plenty of water</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#C1121F;font-size:13px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Please arrive 15 minutes early for check-in</td></tr>
</table>
</div>

<div style="text-align:center;margin:24px 0;">
<a href="https://irvineallstars.com/portal/confirm?id=${registrationId}" style="background:#C1121F;color:#ffffff;padding:14px 32px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:2px;border-radius:6px;display:inline-block;">CONFIRM ATTENDANCE</a>
</div>
<p style="color:#9CA3AF;font-size:13px;line-height:1.5;text-align:center;margin:0 0 16px;">Please confirm so we know to expect ${playerName} at tryouts.</p>

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
    const {
      parent_name,
      parent_email,
      player_name,
      division,
      session_date,
      start_time,
      end_time,
      location,
      field,
      updated,
      registration_id,
    } = body;

    const isUpdated = !!updated;

    if (!parent_email || !player_name || !session_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const htmlContent = getTryoutInviteHtml(
      parent_name || "Parent",
      player_name,
      division || "",
      session_date,
      start_time || "",
      end_time || null,
      location || "",
      field || null,
      isUpdated,
      registration_id || ""
    );

    if (resend) {
      const { error } = await resend.emails.send({
        from: "Irvine All-Stars <noreply@irvineallstars.com>",
        to: parent_email,
        subject: isUpdated
          ? `Updated: ${player_name}'s Tryout Time — ${division}`
          : `${player_name}'s Tryout Time — ${division}`,
        html: htmlContent,
      });

      if (error) {
        console.error("Resend error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      console.log("Resend not configured, email skipped for:", parent_email);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send tryout invite error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
