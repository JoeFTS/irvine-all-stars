import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface PickedPlayer {
  name: string;
  position: string;
  parentName: string;
  parentEmail: string;
}

export async function POST(request: NextRequest) {
  if (!resend) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const body = await request.json();
  const {
    coachName,
    division,
    players,
  }: {
    coachName: string;
    division: string;
    players: PickedPlayer[];
  } = body;

  if (!coachName || !division || !players?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const playerRows = players
    .map(
      (p, i) =>
        `<tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:10px 12px;font-size:14px;color:#333;">${i + 1}</td>
          <td style="padding:10px 12px;font-size:14px;color:#333;font-weight:600;">${p.name}</td>
          <td style="padding:10px 12px;font-size:14px;color:#666;">${p.position}</td>
          <td style="padding:10px 12px;font-size:14px;color:#333;">${p.parentName}</td>
          <td style="padding:10px 12px;font-size:14px;color:#0066cc;">${p.parentEmail}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;padding:40px 20px;">
<tr><td align="center">
<table width="700" cellpadding="0" cellspacing="0" style="max-width:700px;width:100%;">

<tr><td style="background-color:#002868;padding:30px 40px;text-align:center;">
<p style="color:#F59E0B;font-size:14px;margin:0 0 8px 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
<h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase;">Irvine All-Stars</h1>
<p style="color:#F59E0B;font-size:14px;margin:8px 0 0 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
</td></tr>
<tr><td style="background-color:#B22234;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

<tr><td style="background-color:#FFFFFF;padding:40px;">
<h2 style="color:#002868;font-size:20px;font-weight:700;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1px;">
  Coach Recommendations Submitted
</h2>
<p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
  <strong>${coachName}</strong> has submitted their player recommendations for <strong>${division}</strong>.
</p>

<div style="background-color:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:16px 20px;margin:0 0 24px 0;">
  <p style="color:#92400E;font-size:14px;font-weight:600;margin:0;">
    ⚾ ${players.length} player${players.length !== 1 ? "s" : ""} recommended for the ${division} roster
  </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
<tr style="background-color:#002868;">
  <th style="padding:10px 12px;font-size:12px;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:1px;">#</th>
  <th style="padding:10px 12px;font-size:12px;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:1px;">Player</th>
  <th style="padding:10px 12px;font-size:12px;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:1px;">Position</th>
  <th style="padding:10px 12px;font-size:12px;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:1px;">Parent</th>
  <th style="padding:10px 12px;font-size:12px;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:1px;">Email</th>
</tr>
${playerRows}
</table>

<p style="color:#666;font-size:14px;line-height:1.6;margin:24px 0 0 0;">
  Review these recommendations in the <a href="https://irvineallstars.com/admin/tryouts" style="color:#002868;font-weight:600;">Admin Tryouts</a> page.
  Once you approve the selections, you can send notification emails to parents from there.
</p>
</td></tr>

<tr><td style="background-color:#FAFAF8;padding:24px 40px;text-align:center;">
<p style="color:#999;font-size:12px;margin:0;">
  This is an automated notification from irvineallstars.com
</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  try {
    await resend.emails.send({
      from: "Irvine All-Stars <AllStars@irvineallstars.com>",
      to: ["AllStars@irvinepony.com"],
      subject: `Coach Recommendations: ${coachName} — ${division} (${players.length} players)`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send coach picks email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
