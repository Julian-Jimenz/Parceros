export const EVENT = {
  name: "MANIZALES EPIC RACE 2026",
  dateIso: "2026-12-13",
  dateLabel: "13 DE DICIEMBRE DE 2026",
  location: "MANIZALES, CALDAS",
  tagline: "VIVE EL DESAF\u00CDO. SUPERA TUS L\u00CDMITES.",
  timezone: "America/Bogota",
  eventStartTimeIso: null as string | null,
  eventStartTimeConfirmed: false,
  countdownTargetIso: "2026-12-13T00:00:00-05:00",
  jerseyPriceCop: 110_000,
  jerseyPriceLabel: "$110.000 COP",
  /** D\u00EDgitos para copiar al portapapeles (Nequi / Llave). */
  paymentNequi: "3013131008",
  paymentKeyDisplay: "301 3131008",
  paymentMethodsLabel: "Nequi y Llave",
  paymentBeneficiary: "David Plata",
  /** Destino de pago en UI; pendiente confirmaci\u00F3n oficial de la organizaci\u00F3n. */
  paymentDestinationConfirmed: false,
  registrationFreeLabel: "INSCRIPCI\u00D3N GRATUITA",
  minorsEnabled: false,
  /** Textos legales publicados y aprobados (habilita validaci\u00F3n estricta en paso 8). */
  legalDocumentsPublished: false,
  /** Validar campos al usar Siguiente / Confirmar (desactivado mientras se prueba el flujo). */
  registrationStepValidationEnabled: false,
} as const;

export type CategoryId =
  | "open-hombres"
  | "open-mujeres"
  | "recreativa-hombres"
  | "recreativa-mujeres";

export const CATEGORIES: {
  id: CategoryId;
  title: string;
  description: string;
}[] = [
  {
    id: "open-hombres",
    title: "OPEN HOMBRES",
    description: "Categor\u00EDa Open Hombres. Descripci\u00F3n editable desde administraci\u00F3n.",
  },
  {
    id: "open-mujeres",
    title: "OPEN MUJERES",
    description: "Categor\u00EDa Open Mujeres. Descripci\u00F3n editable desde administraci\u00F3n.",
  },
  {
    id: "recreativa-hombres",
    title: "RECREATIVA HOMBRES",
    description: "Categor\u00EDa Recreativa Hombres. Descripci\u00F3n editable desde administraci\u00F3n.",
  },
  {
    id: "recreativa-mujeres",
    title: "RECREATIVA MUJERES",
    description: "Categor\u00EDa Recreativa Mujeres. Descripci\u00F3n editable desde administraci\u00F3n.",
  },
];

export const BICYCLE_TYPES_BY_CATEGORY: Record<CategoryId, string[]> = {
  "open-hombres": [],
  "open-mujeres": [],
  "recreativa-hombres": [],
  "recreativa-mujeres": [],
};

export const BICYCLE_MATRIX_PENDING_MESSAGE =
  "Los tipos de bicicleta permitidos est\u00E1n pendientes de confirmaci\u00F3n por la organizaci\u00F3n.";

export function bicycleTypesForCategory(category: CategoryId | ""): string[] {
  if (!category) return [];
  return [...(BICYCLE_TYPES_BY_CATEGORY[category] ?? [])];
}

export function isBicycleMatrixConfigured(): boolean {
  return (Object.keys(BICYCLE_TYPES_BY_CATEGORY) as CategoryId[]).some(
    (id) => BICYCLE_TYPES_BY_CATEGORY[id].length > 0,
  );
}

export const DOCUMENT_TYPES = [
  { value: "CC", label: "C\u00E9dula de ciudadan\u00EDa" },
  { value: "CE", label: "C\u00E9dula de extranjer\u00EDa" },
  { value: "PA", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de identidad" },
] as const;

export const NATIONALITIES = [
  { value: "CO", label: "Colombia" },
  { value: "OTHER", label: "Otra" },
] as const;

export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "No lo conozco",
] as const;

export const JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const JERSEY_DESIGNS = [
  { value: "niebla", label: "Niebla" },
  { value: "ciudad", label: "Ciudad" },
] as const;

export type JerseyDesignId = (typeof JERSEY_DESIGNS)[number]["value"];

export function jerseyDesignLabel(design: string): string {
  return JERSEY_DESIGNS.find((d) => d.value === design)?.label ?? "-";
}

export const UPLOAD = {
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png", "application/pdf"],
  accept: ".jpg,.jpeg,.png,.pdf",
} as const;

export const FORM_STEPS = [
  { id: 1, title: "Datos personales" },
  { id: 3, title: "Salud" },
  { id: 4, title: "Emergencia" },
  { id: 5, title: "Inscripci\u00F3n y jersey" },
  { id: 6, title: "Pago jersey" },
  { id: 7, title: "Representante legal" },
  { id: 8, title: "Aceptaciones legales" },
  { id: 9, title: "Revisi\u00F3n" },
] as const;

export const REGISTRATION_SUBMIT_SUCCESS =
  "Recibimos tu solicitud. La organizacion revisara los datos y te contactara si es necesario.";

export const REGISTRATION_SUBMIT_ERROR =
  "No pudimos enviar tu inscripcion en este momento. Intenta de nuevo o escribe a la organizacion.";

export const COLOMBIAN_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atl\u00E1ntico",
  "Bol\u00EDvar",
  "Boyac\u00E1",
  "Caldas",
  "Caquet\u00E1",
  "Casanare",
  "Cauca",
  "Cesar",
  "Choc\u00F3",
  "C\u00F3rdoba",
  "Cundinamarca",
  "Guain\u00EDa",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nari\u00F1o",
  "Norte de Santander",
  "Putumayo",
  "Quind\u00EDo",
  "Risaralda",
  "San Andr\u00E9s y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaup\u00E9s",
  "Vichada",
] as const;
