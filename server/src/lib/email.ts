import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Sends an email using nodemailer.
export async function sendEmail(options: SendEmailOptions): Promise<nodemailer.SentMessageInfo> {
  const { to, subject, text, html } = options;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Please configure SMTP environment variables."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    to,
    subject,
    text,
    html,
  };

  const defaultFromName = process.env.SMTP_FROM_NAME || "Phantom";
  const defaultFromAddress = process.env.SMTP_FROM_ADDRESS || user;
  mailOptions.from = `"${defaultFromName}" <${defaultFromAddress}>`;

  console.log(`[Email Utility] Sending email to ${to} via ${host}:${port}...`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email Utility] Email sent successfully. Message ID: ${info.messageId}`);
  return info;
}
