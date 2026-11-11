import {
  CATEGORIES,
  EVENT,
  jerseyDesignLabel,
} from "@/lib/config/event";
import type { RegistrationPayloadJson } from "@/lib/registration/serializeRegistrationPayload";

function categoryTitle(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.title ?? (id || "-");
}

function yn(value: "yes" | "no" | "" | undefined): string {
  if (value === "yes") return "Si";
  if (value === "no") return "No";
  return "-";
}

function bool(value: boolean | undefined): string {
  if (value === true) return "Si";
  if (value === false) return "No";
  return "-";
}

function line(label: string, value: string | undefined | null): string {
  const v = value?.trim() ? value.trim() : "-";
  return `${label}: ${v}`;
}

function jerseySleeveLabel(v: string | undefined): string {
  if (v === "short") return "Corta";
  if (v === "long") return "Larga";
  return "-";
}

function jerseyCutLabel(v: string | undefined): string {
  if (v === "road") return "Ruta";
  if (v === "mtb") return "MTB";
  return "-";
}

function registrationOptionLabel(v: string): string {
  if (v === "free_only") return "Solo inscripcion gratuita";
  if (v === "free_with_jersey") return "Inscripcion gratuita + jersey";
  return "-";
}

export function formatRegistrationNotification(data: RegistrationPayloadJson): {
  subject: string;
  text: string;
  html: string;
} {
  const name = `${data.firstName} ${data.lastName}`.trim() || "Participante";
  const subject = `[${EVENT.name}] Nueva inscripcion - ${name}`;

  const sections: string[][] = [
    [
      "=== DATOS DEL PARTICIPANTE ===",
      line("Nombres", data.firstName),
      line("Apellidos", data.lastName),
      line("Tipo documento", data.documentType),
      line("Numero documento", data.documentNumber),
      line("Fecha nacimiento", data.birthDate),
      line("Sexo", data.sex),
      line("Nacionalidad", data.nationality),
      line("Departamento", data.residenceDepartment),
      line("Municipio", data.residenceMunicipality),
      line("Direccion", data.residenceAddress),
      line("Celular", data.phone),
      line("Correo", data.email),
      line("Club o equipo", data.clubOrTeam),
      line("Categoria", categoryTitle(data.category)),
    ],
    [
      "=== SALUD ===",
      line("EPS", data.eps),
      line("Grupo sanguineo", data.bloodType),
      line("Condicion de salud", yn(data.hasHealthCondition)),
      line("Detalle condicion", data.healthConditionDetail),
      line("Alergias", yn(data.hasAllergies)),
      line("Detalle alergias", data.allergiesDetail),
      line("Medicamentos", yn(data.takesMedication)),
      line("Detalle medicamentos", data.medicationDetail),
      line("Autoriza datos salud emergencia", bool(data.authorizeHealthData)),
    ],
    [
      "=== CONTACTO DE EMERGENCIA ===",
      line("Nombre", data.emergencyName),
      line("Parentesco", data.emergencyRelationship),
      line("Celular", data.emergencyPhone),
      line("Segundo telefono", data.emergencyPhoneSecondary),
    ],
    [
      "=== INSCRIPCION Y JERSEY ===",
      line("Modalidad", registrationOptionLabel(data.registrationOption)),
      ...(data.registrationOption === "free_with_jersey"
        ? [
            line("Diseno jersey", jerseyDesignLabel(data.jerseyDesign ?? "")),
            line("Talla", data.jerseySize),
            line("Manga", jerseySleeveLabel(data.jerseySleeve)),
            line("Corte", jerseyCutLabel(data.jerseyCut)),
            line("Comprobante adjunto", data.paymentReceiptFileName ?? "(sin archivo)"),
          ]
        : []),
    ],
    [
      "=== REPRESENTANTE LEGAL (MENOR) ===",
      line("Nombre", data.guardianName),
      line("Tipo documento", data.guardianDocumentType),
      line("Numero documento", data.guardianDocumentNumber),
      line("Celular", data.guardianPhone),
      line("Correo", data.guardianEmail),
      line("Aceptacion representante", bool(data.guardianAccepted)),
      line("Autorizacion adjunta", data.guardianAuthorizationFileName ?? "(sin archivo)"),
    ],
    [
      "=== ACEPTACIONES ===",
      line("Informacion correcta", bool(data.infoCorrect)),
      line("Reglamento", bool(data.acceptRegulation)),
      line("Declaracion de riesgos", bool(data.acceptRiskWaiver)),
      line("Politica de privacidad", bool(data.acceptPrivacy)),
      line("Uso de imagen", bool(data.authorizeImageUse)),
      line("Novedades del evento", bool(data.subscribeEvents)),
    ],
  ];

  const text = [
    `Nueva solicitud de inscripcion - ${EVENT.name}`,
    `Enviada: ${new Date().toLocaleString("es-CO", { timeZone: EVENT.timezone })}`,
    "",
    ...sections.flatMap((block) => [...block, ""]),
  ].join("\n");

  const htmlBody = sections
    .map(
      (block) =>
        `<section style="margin-bottom:1.25rem"><h3 style="font-size:14px;margin:0 0 8px">${block[0]}</h3><pre style="font-family:ui-monospace,monospace;font-size:12px;white-space:pre-wrap;margin:0">${block
          .slice(1)
          .join("\n")}</pre></section>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#111;padding:16px">
    <h2 style="margin-top:0">Nueva inscripcion - ${EVENT.name}</h2>
    <p style="color:#555">${new Date().toLocaleString("es-CO", { timeZone: EVENT.timezone })}</p>
    ${htmlBody}
  </body></html>`;

  return { subject, text, html };
}
