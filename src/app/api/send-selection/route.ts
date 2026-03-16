import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SelectionRequest {
  registration_id: string;
  status: "selected" | "not_selected" | "alternate";
  division: string;
  player_name: string;
  parent_name: string;
  parent_email: string;
  team_name?: string;
  coach_name?: string;
}

function getEmailHeader() {
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
<tr><td style="background-color:#C1121F;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function getEmailFooter() {
  return `<tr><td style="background-color:#0A2342;padding:20px 40px;text-align:center;">
<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">Irvine PONY All-Stars &bull; 2026<br><a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function getSelectedHtml(data: SelectionRequest) {
  const { player_name, parent_name, division, team_name, coach_name } = data;
  const portalUrl = "https://irvineallstars.com/portal";

  const teamLine = team_name
    ? `<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Team: <strong style="color:#0A2342;">${team_name}</strong>${coach_name ? ` &mdash; coached by <strong style="color:#0A2342;">${coach_name}</strong>` : ""}</p>`
    : "";

  return `${getEmailHeader()}
<tr><td style="background-color:#FFFFFF;padding:40px;">
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
<tr><td align="center">
<p style="color:#F4B400;font-size:28px;margin:0;letter-spacing:6px;">&#9733; &#9733; &#9733; &#9733; &#9733;</p>
</td></tr></table>
<h2 style="color:#0A2342;font-size:22px;font-weight:700;margin:0 0 20px 0;text-align:center;">Congratulations!</h2>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Dear ${parent_name},</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;"><strong style="color:#0A2342;">${player_name} has earned a spot on the Irvine PONY All-Stars ${division} team!</strong></p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Our evaluators saw something special during tryouts, and ${player_name} backed it up. The effort showed, and it paid off. You should be really proud.</p>
${teamLine}
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8E1;border-left:4px solid #F4B400;border-radius:4px;margin:0 0 24px 0;">
<tr><td style="padding:20px;">
<h3 style="color:#0A2342;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">What Happens Next</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#F4B400;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Your head coach will be reaching out soon with practice schedules and details.</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#F4B400;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Log in to the Parent Portal to complete all required documents.</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#F4B400;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Tournament season kicks off with the Memorial Day Tournament.</td></tr>
</table></td></tr></table>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">Being an All-Star means representing Irvine PONY beyond the regular season. ${player_name} is now part of something bigger &mdash; a group of kids who earned this through hard work, and a community that's going to be cheering them on all summer.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;" width="100%">
<tr><td align="center">
<a href="${portalUrl}" style="display:inline-block;background-color:#C1121F;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">Log In to Parent Portal</a>
</td></tr></table>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 4px 0;">See you on the diamond.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;"><strong style="color:#0A2342;">Irvine PONY All-Stars Coordinator</strong><br><a href="mailto:AllStars@irvineallstars.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvineallstars.com</a></p>
</td></tr>
${getEmailFooter()}`;
}

function getNotSelectedHtml(data: SelectionRequest) {
  const { player_name, parent_name, division } = data;

  return `${getEmailHeader()}
<tr><td style="background-color:#FFFFFF;padding:40px;">
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Dear ${parent_name},</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Thank you for bringing ${player_name} out to All-Stars tryouts this year. We know it takes courage to put yourself out there, and ${player_name} did exactly that.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">After careful evaluation by our independent scoring panel, we were not able to offer ${player_name} a roster spot on the ${division} All-Stars team this season.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Tryouts were competitive. With a large group of talented players trying out for 12 roster spots, the scores were close and this decision was not easy. Every kid who showed up and gave their best effort should feel good about that.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4F8;border-left:4px solid #0A2342;border-radius:4px;margin:0 0 24px 0;">
<tr><td style="padding:20px;">
<p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0;">Players who were not selected may still be called up if a roster spot opens. If that happens, we will reach out to you directly.</p>
</td></tr></table>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">The best thing ${player_name} can do right now is keep working, keep competing, and keep loving the game. The regular season is where real growth happens, and next year's tryouts will be here before you know it.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">We genuinely hope to see ${player_name} back out there.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 4px 0;">Thank you for being part of the All-Stars program.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;"><strong style="color:#0A2342;">Irvine PONY All-Stars Coordinator</strong><br><a href="mailto:AllStars@irvineallstars.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvineallstars.com</a></p>
</td></tr>
${getEmailFooter()}`;
}

function getAlternateHtml(data: SelectionRequest) {
  const { player_name, parent_name, division } = data;

  return `${getEmailHeader()}
<tr><td style="background-color:#FFFFFF;padding:40px;">
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Dear ${parent_name},</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;"><strong style="color:#0A2342;">${player_name} has been named as an alternate for the Irvine PONY All-Stars ${division} team.</strong></p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Being named an alternate is an achievement &mdash; it means ${player_name} was right there. The evaluation scores were close, and our panel recognized the talent and effort ${player_name} brought to tryouts.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8E1;border-left:4px solid #F4B400;border-radius:4px;margin:0 0 24px 0;">
<tr><td style="padding:20px;">
<h3 style="color:#0A2342;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">What Being an Alternate Means</h3>
<table cellpadding="0" cellspacing="0">
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#F4B400;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">If a rostered player is unable to participate, alternates are called up in order.</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#F4B400;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Stay ready &mdash; the coach may invite alternates to join some practices.</td></tr>
<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#F4B400;font-size:14px;">&#9733;</td><td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">We will contact you directly if a spot opens up.</td></tr>
</table></td></tr></table>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">In the meantime, the best thing ${player_name} can do is keep practicing and stay sharp. Opportunities come up more often than you might think, and we want ${player_name} ready to step in.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 4px 0;">Thank you for being part of the All-Stars program. We'll be in touch.</p>
<p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;"><strong style="color:#0A2342;">Irvine PONY All-Stars Coordinator</strong><br><a href="mailto:AllStars@irvineallstars.com" style="color:#0A2342;text-decoration:underline;">AllStars@irvineallstars.com</a></p>
</td></tr>
${getEmailFooter()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelectionRequest;
    const {
      registration_id,
      status,
      division,
      player_name,
      parent_name,
      parent_email,
    } = body;

    // Validate required fields
    if (
      !registration_id ||
      !status ||
      !division ||
      !player_name ||
      !parent_name ||
      !parent_email
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: registration_id, status, division, player_name, parent_name, parent_email",
        },
        { status: 400 }
      );
    }

    if (!["selected", "not_selected", "alternate"].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "selected", "not_selected", or "alternate"' },
        { status: 400 }
      );
    }

    // Build subject and HTML based on status
    let subject: string;
    let htmlContent: string;

    switch (status) {
      case "selected":
        subject = `Congratulations! ${player_name} Has Been Selected for All-Stars`;
        htmlContent = getSelectedHtml(body);
        break;
      case "not_selected":
        subject = `${player_name} — All-Stars Tryout Results`;
        htmlContent = getNotSelectedHtml(body);
        break;
      case "alternate":
        subject = `${player_name} — All-Stars Alternate Selection`;
        htmlContent = getAlternateHtml(body);
        break;
    }

    if (resend) {
      const { error: emailError } = await resend.emails.send({
        from: "Irvine All-Stars <AllStars@irvineallstars.com>",
        to: [parent_email],
        subject,
        html: htmlContent,
      });

      if (emailError) {
        console.error("Resend error:", emailError);
        return NextResponse.json(
          { error: "Failed to send selection email" },
          { status: 500 }
        );
      }
    } else {
      console.warn("RESEND_API_KEY not configured, selection email not sent");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Selection email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
