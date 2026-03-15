import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getCoachEmailHtml(name: string, division: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#002868;padding:30px 40px;text-align:center;">
              <p style="color:#F59E0B;font-size:14px;margin:0 0 8px 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
              <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase;">
                Irvine All-Stars
              </h1>
              <p style="color:#F59E0B;font-size:14px;margin:8px 0 0 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
            </td>
          </tr>

          <!-- Red stripe -->
          <tr>
            <td style="background-color:#B22234;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px;">
              <h2 style="color:#002868;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">
                Application Received
              </h2>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
                Hi ${name},
              </p>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                Thank you for applying to coach the <strong style="color:#002868;">${division}</strong> All-Stars team for the 2026 season. We have received your application and it is now under review.
              </p>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1EB;border-radius:8px;margin:0 0 24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <h3 style="color:#1C1C1C;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">
                      What Happens Next
                    </h3>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td>
                        <td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">The committee will review your application within 1-2 weeks.</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td>
                        <td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Background checks will be initiated.</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td>
                        <td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">Top candidates will be invited for a brief interview.</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 12px 4px 0;vertical-align:top;color:#B22234;font-size:14px;">&#9733;</td>
                        <td style="padding:4px 0;color:#4B5563;font-size:14px;line-height:1.5;">You will be notified of the final decision via email.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 8px 0;">
                If you have any questions in the meantime, please don't hesitate to reach out.
              </p>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;">
                Best regards,<br>
                <strong style="color:#002868;">Irvine Pony Baseball All-Stars</strong><br>
                <a href="mailto:AllStars@irvinepony.com" style="color:#002868;text-decoration:underline;">AllStars@irvinepony.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#002868;padding:20px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">
                Irvine Pony Baseball &bull; 2026 All-Stars Season<br>
                <a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getPlayerEmailHtml(name: string, playerName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Received</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#002868;padding:30px 40px;text-align:center;">
              <p style="color:#F59E0B;font-size:14px;margin:0 0 8px 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
              <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase;">
                Irvine All-Stars
              </h1>
              <p style="color:#F59E0B;font-size:14px;margin:8px 0 0 0;letter-spacing:3px;">&#9733;&#9733;&#9733;</p>
            </td>
          </tr>

          <!-- Red stripe -->
          <tr>
            <td style="background-color:#B22234;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px;">
              <h2 style="color:#002868;font-size:20px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">
                Tryout Registration Received
              </h2>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
                Hi ${name},
              </p>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                Thank you for registering <strong style="color:#002868;">${playerName}</strong> for the 2026 All-Stars tryouts. We have received the registration and will send tryout details as the date approaches.
              </p>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                Check <a href="https://irvineallstars.com/tryouts" style="color:#002868;text-decoration:underline;">irvineallstars.com/tryouts</a> for the latest tryout schedule, what to bring, and how players are evaluated.
              </p>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0 0 8px 0;">
                If you have any questions, please contact the All-Stars Coordinator.
              </p>

              <p style="color:#4B5563;font-size:16px;line-height:1.6;margin:0;">
                Best regards,<br>
                <strong style="color:#002868;">Irvine Pony Baseball All-Stars</strong><br>
                <a href="mailto:AllStars@irvinepony.com" style="color:#002868;text-decoration:underline;">AllStars@irvinepony.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#002868;padding:20px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.5;">
                Irvine Pony Baseball &bull; 2026 All-Stars Season<br>
                <a href="https://irvineallstars.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">irvineallstars.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

    // Use Supabase edge function or direct SMTP
    // For now, we'll use Supabase's built-in email via the auth admin API
    // or a simple Resend/Nodemailer setup
    // Since we need a working email solution, let's use Supabase's
    // database to queue the email and log it

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping email");
      return NextResponse.json({ success: true, note: "Email skipped - not configured" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: "irvine_allstars" },
    });

    const htmlContent =
      type === "coach"
        ? getCoachEmailHtml(name, division || "")
        : getPlayerEmailHtml(name, playerName || "");

    // Log the email in a simple table for now
    // In production, integrate with Resend, SendGrid, or similar
    await supabaseAdmin.from("email_log").insert({
      to_email: email,
      to_name: name,
      subject:
        type === "coach"
          ? "Irvine All-Stars — Coach Application Received"
          : "Irvine All-Stars — Tryout Registration Received",
      html_body: htmlContent,
      email_type: type,
      status: "queued",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to process email" },
      { status: 500 }
    );
  }
}
