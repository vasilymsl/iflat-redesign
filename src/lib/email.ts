import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

const MAIL_FROM = process.env.MAIL_FROM || "noreply@iflat.ru";
const MAIL_TO = process.env.MAIL_TO || "info@iflat.ru";

interface SendMailOptions {
  subject: string;
  html: string;
  to?: string;
}

export async function sendMail({ subject, html, to }: SendMailOptions) {
  // В dev-режиме без SMTP просто логируем
  if (!process.env.SMTP_HOST) {
    console.log("[EMAIL] SMTP не настроен. Письмо:", { subject, to: to || MAIL_TO });
    console.log("[EMAIL] Тело:", html);
    return { success: true, dev: true };
  }

  await transporter.sendMail({
    from: MAIL_FROM,
    to: to || MAIL_TO,
    subject,
    html,
  });

  return { success: true };
}
