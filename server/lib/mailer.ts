import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_PORT === "465",
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string,
  resetToken: string
): Promise<boolean> {
  const transport = createTransport();
  if (!transport) return false;

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_USER;

  await transport.sendMail({
    from: `"WanderSync" <${from}>`,
    to: toEmail,
    subject: "Reset your WanderSync password",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#111;">
  <h2 style="margin-bottom:8px;">Reset your password</h2>
  <p>Hi ${toName},</p>
  <p>We received a request to reset the password for your WanderSync account.</p>
  <p style="margin:24px 0;">
    <a href="${resetLink}"
       style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      Reset Password
    </a>
  </p>
  <p style="color:#666;font-size:14px;">
    This link expires in 30 minutes. If you didn't request a password reset, you can safely ignore this email.
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
  <p style="color:#999;font-size:12px;">
    If the button doesn't work, copy and paste this URL into your browser:<br/>
    <a href="${resetLink}" style="color:#2563eb;">${resetLink}</a>
  </p>
</body>
</html>`,
    text: `Hi ${toName},\n\nReset your WanderSync password:\n${resetLink}\n\nThis link expires in 30 minutes.`,
  });

  return true;
}
