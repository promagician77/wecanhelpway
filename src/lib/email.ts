import "server-only";

const FROM = process.env.EMAIL_FROM ?? "WeCanHelpWay <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface MailInput {
  to: string;
  subject: string;
  heading: string;
  body: string;
  /** Optional call to action rendered as a button. */
  cta?: { label: string; href: string };
  footnote?: string;
}

/**
 * Sends transactional mail through Resend. Without RESEND_API_KEY the message
 * is logged instead of sent, so local development never silently fails.
 */
export async function sendMail(input: MailInput): Promise<{ ok: boolean; skipped?: boolean }> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.info(
      `[email:skipped] → ${input.to}\n  subject: ${input.subject}\n  ${input.heading}\n  ${input.body}` +
        (input.cta ? `\n  cta: ${input.cta.label} ${input.cta.href}` : ""),
    );
    return { ok: true, skipped: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: renderEmail(input),
      text: `${input.heading}\n\n${input.body}${input.cta ? `\n\n${input.cta.label}: ${input.cta.href}` : ""}`,
    });
    if (error) {
      console.error("[email:error]", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email:error]", err);
    return { ok: false };
  }
}

/** Dark, brand-matched template that still degrades gracefully in Outlook. */
function renderEmail({ heading, body, cta, footnote }: MailInput) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:#04050c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04050c;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0d1e;border:1px solid rgba(255,255,255,0.09);border-radius:20px;overflow:hidden;">
        <tr><td style="height:3px;background:linear-gradient(90deg,#6a44f5,#7c5cff 50%,#22c9e6);"></td></tr>
        <tr><td style="padding:34px 36px 0;">
          <div style="font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8f74ff;">WeCanHelpWay</div>
          <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;font-weight:600;color:#ffffff;letter-spacing:-0.02em;">${escapeHtml(heading)}</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:rgba(237,240,255,0.66);">${escapeHtml(body)}</p>
        </td></tr>
        ${
          cta
            ? `<tr><td style="padding:28px 36px 0;">
                 <a href="${cta.href}" style="display:inline-block;padding:14px 28px;border-radius:14px;background:linear-gradient(110deg,#6a44f5,#7c5cff 45%,#22c9e6);color:#fff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(cta.label)}</a>
               </td></tr>`
            : ""
        }
        <tr><td style="padding:32px 36px 34px;">
          <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:20px;"></div>
          <p style="margin:0;font-size:12.5px;line-height:1.6;color:rgba(237,240,255,0.34);">
            ${footnote ? `${escapeHtml(footnote)}<br><br>` : ""}
            You're receiving this because you have a WeCanHelpWay account.
            <a href="${SITE}/notifications" style="color:#8f74ff;text-decoration:none;">Manage notifications</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
