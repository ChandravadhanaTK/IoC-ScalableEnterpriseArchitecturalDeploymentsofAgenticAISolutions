import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || 'SkillBridge AI <noreply@skillbridge.ai>';

export const isSmtpConfigured = Boolean(
  SMTP_HOST &&
  SMTP_USER &&
  SMTP_PASSWORD
);

export function getMailTransporter() {
  if (!isSmtpConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const transporter = getMailTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password - SkillBridge AI</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; margin: 0; padding: 40px 20px; color: #f8fafc;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">SkillBridge AI</h1>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">Password Reset Request</p>
    </div>
    <div style="border-top: 1px solid #1e293b; padding-top: 24px; margin-bottom: 24px;">
      <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">Reset your password</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Click the button below to choose a new password.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 24px;">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #818cf8; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div style="border-top: 1px solid #1e293b; padding-top: 16px; text-align: center;">
      <p style="color: #64748b; font-size: 11px; margin: 0;">
        If you did not request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
SkillBridge AI

Reset your password

Click the button below to choose a new password:
${resetUrl}

If you did not request a password reset, please ignore this email.
  `.trim();

  if (!transporter) {
    console.log(`[Nodemailer Notice] SMTP credentials missing in .env. Reset request processed for: ${toEmail}`);
    return { success: false, error: 'SMTP provider credentials are not configured in environment variables.' };
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: toEmail,
      subject: 'Reset your password - SkillBridge AI',
      text: textContent,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[Nodemailer Send Error]:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to send email via SMTP.' };
  }
}
