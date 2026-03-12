import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || "";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS environment variables are required for sending email");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  console.log(`[Mail] SMTP configured: ${SMTP_HOST}:${SMTP_PORT} as ${SMTP_USER}`);
  return transporter;
}

export async function sendApplicationConfirmation(
  toEmail: string,
  userName: string,
  schemeName: string,
  applicationId: number
): Promise<string | null> {
  try {
    const transport = getTransporter();
    const from = MAIL_FROM || SMTP_USER;

    const info = await transport.sendMail({
      from,
      to: toEmail,
      subject: `Application Confirmed — ${schemeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF9933 0%, #000080 50%, #138808 100%); padding: 3px; border-radius: 12px;">
            <div style="background: #ffffff; border-radius: 10px; padding: 30px;">
              <h1 style="color: #000080; margin: 0 0 10px;">Government Scheme Portal</h1>
              <hr style="border: none; border-top: 2px solid #FF9933; margin: 15px 0;" />

              <p style="font-size: 16px; color: #333;">Dear <strong>${userName}</strong>,</p>

              <p style="font-size: 15px; color: #333; line-height: 1.6;">
                Your application for the following scheme has been successfully submitted:
              </p>

              <div style="background: #f0f4ff; border-left: 4px solid #000080; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000080;">${schemeName}</p>
                <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Application ID: #${applicationId}</p>
                <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Status: <strong style="color: #b45309;">Pending</strong></p>
              </div>

              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                Your application is being reviewed. You can track the status from your
                <strong>My Applications</strong> dashboard.
              </p>

              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                Please complete the application on the official government portal if you haven't already.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
              <p style="font-size: 12px; color: #999; margin: 0;">
                This is an automated email from the Government Scheme Awareness Portal.
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`[Mail] Confirmation sent, messageId: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.error("[Mail] Failed to send email:", err);
    return null;
  }
}

export async function sendApplicationRejection(
  toEmail: string,
  userName: string,
  schemeName: string,
  applicationId: number
): Promise<string | null> {
  try {
    const transport = getTransporter();
    const from = MAIL_FROM || SMTP_USER;

    const info = await transport.sendMail({
      from,
      to: toEmail,
      subject: `Application Update — ${schemeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF9933 0%, #000080 50%, #138808 100%); padding: 3px; border-radius: 12px;">
            <div style="background: #ffffff; border-radius: 10px; padding: 30px;">
              <h1 style="color: #000080; margin: 0 0 10px;">Government Scheme Portal</h1>
              <hr style="border: none; border-top: 2px solid #FF9933; margin: 15px 0;" />

              <p style="font-size: 16px; color: #333;">Dear <strong>${userName}</strong>,</p>

              <p style="font-size: 15px; color: #333; line-height: 1.6;">
                We regret to inform you that your application for the following scheme has been <strong style="color: #dc2626;">rejected</strong>:
              </p>

              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #dc2626;">${schemeName}</p>
                <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Application ID: #${applicationId}</p>
                <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Status: <strong style="color: #dc2626;">Rejected</strong></p>
              </div>

              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                This could be due to incomplete documentation or not meeting eligibility criteria.
                You may review the scheme requirements and re-apply if eligible.
              </p>

              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                If you believe this is an error, please visit the official government portal
                or contact the relevant ministry for further assistance.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
              <p style="font-size: 12px; color: #999; margin: 0;">
                This is an automated email from the Government Scheme Awareness Portal.
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`[Mail] Rejection sent, messageId: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.error("[Mail] Failed to send rejection email:", err);
    return null;
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string
): Promise<string | null> {
  try {
    const transport = getTransporter();
    const from = MAIL_FROM || SMTP_USER;

    const info = await transport.sendMail({
      from,
      to: toEmail,
      subject: "Password Reset — Government Scheme Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF9933 0%, #000080 50%, #138808 100%); padding: 3px; border-radius: 12px;">
            <div style="background: #ffffff; border-radius: 10px; padding: 30px;">
              <h1 style="color: #000080; margin: 0 0 10px;">Government Scheme Portal</h1>
              <hr style="border: none; border-top: 2px solid #FF9933; margin: 15px 0;" />

              <p style="font-size: 16px; color: #333;">Hello,</p>

              <p style="font-size: 15px; color: #333; line-height: 1.6;">
                We received a request to reset your password. Click the button below to set a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="display: inline-block; background: #000080; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 13px; color: #888; line-height: 1.6;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; color: #000080; word-break: break-all;">${resetLink}</p>

              <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 20px;">
                This link will expire in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
              <p style="font-size: 12px; color: #999; margin: 0;">
                This is an automated email from the Government Scheme Awareness Portal.
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`[Mail] Password reset email sent, messageId: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.error("[Mail] Failed to send password reset email:", err);
    return null;
  }
}
