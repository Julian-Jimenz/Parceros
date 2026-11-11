import { formatRegistrationNotification } from "@/lib/email/formatRegistrationNotification";
import type { RegistrationPayloadJson } from "@/lib/registration/serializeRegistrationPayload";
import nodemailer from "nodemailer";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

const DEFAULT_NOTIFY_TO = "jimeneztorojulian@gmail.com";

function getNotifyRecipient(): string {
  return process.env.REGISTRATION_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_TO;
}

type SmtpTransporter = ReturnType<typeof nodemailer.createTransport>;

function getSmtpConfig():
  | { ok: true; transporter: SmtpTransporter }
  | { ok: false; reason: string } {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return {
      ok: false,
      reason:
        "SMTP no configurado. Defina SMTP_HOST, SMTP_USER y SMTP_PASS en .env (por ejemplo Gmail con contrasena de aplicacion).",
    };
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return { ok: true, transporter };
}

export async function sendRegistrationNotification(
  data: RegistrationPayloadJson,
  attachments: MailAttachment[] = [],
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const smtp = getSmtpConfig();
  if (!smtp.ok) return smtp;

  const { subject, text, html } = formatRegistrationNotification(data);
  const from =
    process.env.SMTP_FROM?.trim() ||
    `"${process.env.SMTP_FROM_NAME ?? "Manizales Epic Race"}" <${process.env.SMTP_USER}>`;

  try {
    await smtp.transporter.sendMail({
      from,
      to: getNotifyRecipient(),
      replyTo: data.email?.trim() || undefined,
      subject,
      text,
      html,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al enviar correo";
    return { ok: false, reason: message };
  }
}
