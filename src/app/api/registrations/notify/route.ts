import { sendRegistrationNotification, type MailAttachment } from "@/lib/email/sendRegistrationNotification";
import { UPLOAD } from "@/lib/config/event";
import type { RegistrationPayloadJson } from "@/lib/registration/serializeRegistrationPayload";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = UPLOAD.maxBytes;

async function readFileAttachment(
  file: FormDataEntryValue | null,
  field: string,
): Promise<MailAttachment | { error: string } | null> {
  if (file == null) return null;
  if (!(file instanceof File) || file.size === 0) return null;

  if (!(UPLOAD.mimeTypes as readonly string[]).includes(file.type)) {
    return { error: `Archivo ${field}: formato no permitido.` };
  }
  if (file.size > MAX_BYTES) {
    return { error: `Archivo ${field}: supera 5 MB.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    filename: file.name || field,
    content: buffer,
    contentType: file.type,
  };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return NextResponse.json({ error: "Falta el payload del formulario." }, { status: 400 });
  }

  let data: RegistrationPayloadJson;
  try {
    data = JSON.parse(raw) as RegistrationPayloadJson;
  } catch {
    return NextResponse.json({ error: "Payload JSON invalido." }, { status: 400 });
  }

  const attachments: MailAttachment[] = [];

  const receipt = await readFileAttachment(formData.get("paymentReceipt"), "paymentReceipt");
  if (receipt && "error" in receipt) {
    return NextResponse.json({ error: receipt.error }, { status: 400 });
  }
  if (receipt && "content" in receipt) attachments.push(receipt);

  const guardian = await readFileAttachment(
    formData.get("guardianAuthorization"),
    "guardianAuthorization",
  );
  if (guardian && "error" in guardian) {
    return NextResponse.json({ error: guardian.error }, { status: 400 });
  }
  if (guardian && "content" in guardian) attachments.push(guardian);

  const result = await sendRegistrationNotification(data, attachments);
  if (!result.ok) {
    console.error("[registrations/notify]", result.reason);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? result.reason
            : "No se pudo enviar la notificacion. Intente mas tarde.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
