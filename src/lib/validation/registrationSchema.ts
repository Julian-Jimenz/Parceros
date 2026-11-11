import { EVENT, UPLOAD } from "@/lib/config/event";
import { ageAtEventDate, isAdultAtEvent } from "@/lib/age";
import { z } from "zod";

const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const categoryEnum = z.enum([
  "open-hombres",
  "open-mujeres",
  "recreativa-hombres",
  "recreativa-mujeres",
]);

export type RegistrationFormValues = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  sex: string;
  nationality: string;
  residenceDepartment: string;
  residenceMunicipality: string;
  residenceAddress: string;
  phone: string;
  email: string;
  clubOrTeam?: string;
  category: string;
  eps: string;
  bloodType: string;
  hasHealthCondition: "yes" | "no" | "";
  healthConditionDetail?: string;
  hasAllergies: "yes" | "no" | "";
  allergiesDetail?: string;
  takesMedication: "yes" | "no" | "";
  medicationDetail?: string;
  authorizeHealthData: boolean;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyPhoneSecondary?: string;
  registrationOption: "free_only" | "free_with_jersey" | "";
  jerseySize?: string;
  jerseyDesign?: "niebla" | "ciudad" | "";
  jerseySleeve?: "short" | "long" | "";
  jerseyCut?: "road" | "mtb" | "";
  payerName?: string;
  paymentDate?: string;
  paymentReference?: string;
  paymentReceipt?: FileList;
  guardianName?: string;
  guardianDocumentType?: string;
  guardianDocumentNumber?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianAuthorization?: FileList;
  guardianAccepted?: boolean;
  infoCorrect: boolean;
  acceptRegulation: boolean;
  acceptRiskWaiver: boolean;
  acceptPrivacy: boolean;
  authorizeImageUse?: boolean;
  subscribeEvents?: boolean;
};

export const defaultRegistrationValues: RegistrationFormValues = {
  firstName: "",
  lastName: "",
  documentType: "",
  documentNumber: "",
  birthDate: "",
  sex: "",
  nationality: "CO",
  residenceDepartment: "",
  residenceMunicipality: "",
  residenceAddress: "",
  phone: "",
  email: "",
  clubOrTeam: "",
  category: "",
  eps: "",
  bloodType: "",
  hasHealthCondition: "",
  healthConditionDetail: "",
  hasAllergies: "",
  allergiesDetail: "",
  takesMedication: "",
  medicationDetail: "",
  authorizeHealthData: false,
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  emergencyPhoneSecondary: "",
  registrationOption: "",
  jerseySize: "",
  jerseyDesign: "",
  jerseySleeve: "",
  jerseyCut: "",
  payerName: "",
  paymentDate: "",
  paymentReference: "",
  infoCorrect: false,
  acceptRegulation: false,
  acceptRiskWaiver: false,
  acceptPrivacy: false,
  authorizeImageUse: false,
  subscribeEvents: false,
};

function validatePhoneField(
  value: string,
  key: keyof RegistrationFormValues,
  errors: Partial<Record<keyof RegistrationFormValues, string>>,
  emptyMessage: string,
) {
  if (!value?.trim()) {
    errors[key] = emptyMessage;
    return;
  }
  if (!phoneRegex.test(value)) errors[key] = "Formato de telefono no valido.";
}

function validateEmailField(
  value: string,
  errors: Partial<Record<keyof RegistrationFormValues, string>>,
) {
  if (!value?.trim()) {
    errors.email = "Ingresa tu correo.";
    return;
  }
  if (!emailRegex.test(value)) errors.email = "Correo no valido.";
}

function validateFileField(
  file: File | undefined,
  key: keyof RegistrationFormValues,
  errors: Partial<Record<keyof RegistrationFormValues, string>>,
  required = true,
) {
  if (!file) {
    if (required) errors[key] = "Debe adjuntar un archivo.";
    return;
  }
  if (!(UPLOAD.mimeTypes as readonly string[]).includes(file.type)) {
    errors[key] = "Formato no permitido. Use JPG, PNG o PDF.";
    return;
  }
  if (file.size > UPLOAD.maxBytes) {
    errors[key] = "El archivo supera 5 MB.";
  }
}

function validateYesNo(
  value: "yes" | "no" | "" | undefined,
  field: keyof RegistrationFormValues,
  detail: string | undefined,
  detailField: keyof RegistrationFormValues,
  label: string,
  errors: Partial<Record<keyof RegistrationFormValues, string>>,
) {
  if (value !== "yes" && value !== "no") {
    errors[field] = `Indica si tienes ${label}.`;
    return;
  }
  if (value === "yes" && !detail?.trim()) {
    errors[detailField] = "Describe el detalle.";
  }
}

export function validateRegistrationStep(
  step: number,
  data: RegistrationFormValues,
): { success: boolean; errors: Partial<Record<keyof RegistrationFormValues, string>> } {
  const errors: Partial<Record<keyof RegistrationFormValues, string>> = {};

  if (step === 1) {
    if (!data.firstName.trim()) errors.firstName = "Ingresa tus nombres.";
    if (!data.lastName.trim()) errors.lastName = "Ingresa tus apellidos.";
    if (!data.documentType) errors.documentType = "Selecciona el tipo de documento.";
    if (!data.documentNumber.trim()) errors.documentNumber = "Ingresa el numero de documento.";
    if (!data.birthDate) {
      errors.birthDate = "Ingresa tu fecha de nacimiento.";
    } else {
      const d = new Date(`${data.birthDate}T12:00:00`);
      if (Number.isNaN(d.getTime())) errors.birthDate = "Fecha no valida.";
      else {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (d > today) errors.birthDate = "La fecha no puede ser futura.";
        const age = ageAtEventDate(data.birthDate);
        if (age !== null && age < 18 && !EVENT.minorsEnabled) {
          errors.birthDate =
            "La participaci\u00F3n de menores no est\u00E1 habilitada. Pendiente requisitos legales.";
        }
      }
    }
    if (!data.sex) errors.sex = "Selecciona el sexo.";
    if (!data.nationality) errors.nationality = "Selecciona la nacionalidad.";
    if (!data.residenceDepartment.trim()) errors.residenceDepartment = "Ingresa el departamento.";
    if (!data.residenceMunicipality.trim()) errors.residenceMunicipality = "Ingresa el municipio.";
    if (!data.residenceAddress.trim()) errors.residenceAddress = "Ingresa la direccion.";
    validatePhoneField(data.phone, "phone", errors, "Ingresa el celular.");
    validateEmailField(data.email, errors);
    if (!categoryEnum.safeParse(data.category).success) {
      errors.category = "Selecciona una categoria.";
    }
  }

  if (step === 3) {
    if (!data.eps?.trim()) errors.eps = "Ingresa tu EPS.";
    if (!data.bloodType) errors.bloodType = "Selecciona el grupo sanguineo.";
    validateYesNo(
      data.hasHealthCondition,
      "hasHealthCondition",
      data.healthConditionDetail,
      "healthConditionDetail",
      "condicion de salud",
      errors,
    );
    validateYesNo(
      data.hasAllergies,
      "hasAllergies",
      data.allergiesDetail,
      "allergiesDetail",
      "alergias",
      errors,
    );
    validateYesNo(
      data.takesMedication,
      "takesMedication",
      data.medicationDetail,
      "medicationDetail",
      "medicamentos",
      errors,
    );
    if (!data.authorizeHealthData) {
      errors.authorizeHealthData =
        "Debes autorizar el tratamiento de datos de salud para emergencia (texto sujeto a validacion juridica).";
    }
  }

  if (step === 4) {
    if (!data.emergencyName.trim()) errors.emergencyName = "Ingresa el nombre.";
    if (!data.emergencyRelationship.trim()) errors.emergencyRelationship = "Indica la relacion.";
    validatePhoneField(data.emergencyPhone, "emergencyPhone", errors, "Ingresa el celular.");
    if (data.emergencyPhoneSecondary && !phoneRegex.test(data.emergencyPhoneSecondary)) {
      errors.emergencyPhoneSecondary = "Formato de telefono no valido.";
    }
  }

  if (step === 5) {
    if (data.registrationOption !== "free_only" && data.registrationOption !== "free_with_jersey") {
      errors.registrationOption = "Selecciona la modalidad.";
    }
    if (data.registrationOption === "free_with_jersey") {
      if (!data.jerseyDesign) errors.jerseyDesign = "Selecciona el diseno del jersey.";
      if (!data.jerseySize) errors.jerseySize = "Selecciona la talla.";
      if (!data.jerseySleeve) errors.jerseySleeve = "Selecciona la manga.";
      if (!data.jerseyCut) errors.jerseyCut = "Selecciona el corte.";
    }
  }

  if (step === 6 && data.registrationOption === "free_with_jersey") {
    validateFileField(data.paymentReceipt?.[0], "paymentReceipt", errors, true);
  }

  if (step === 7 && data.birthDate && !isAdultAtEvent(data.birthDate) && EVENT.minorsEnabled) {
    if (!data.guardianName?.trim()) errors.guardianName = "Nombre del representante.";
    if (!data.guardianDocumentType) errors.guardianDocumentType = "Tipo de documento.";
    if (!data.guardianDocumentNumber?.trim()) errors.guardianDocumentNumber = "Numero de documento.";
    validatePhoneField(data.guardianPhone ?? "", "guardianPhone", errors, "Celular del representante.");
    if (!data.guardianEmail?.trim() || !emailRegex.test(data.guardianEmail)) {
      errors.guardianEmail = "Correo del representante no valido.";
    }
    if (!data.guardianAccepted) errors.guardianAccepted = "Aceptacion requerida.";
    validateFileField(data.guardianAuthorization?.[0], "guardianAuthorization", errors, true);
  }

  if (step === 8 && EVENT.legalDocumentsPublished) {
    if (!data.infoCorrect) errors.infoCorrect = "Confirma que la informacion es correcta.";
    if (!data.acceptRegulation) errors.acceptRegulation = "Acepta el reglamento.";
    if (!data.acceptRiskWaiver) errors.acceptRiskWaiver = "Acepta la declaracion de riesgos.";
    if (!data.acceptPrivacy) errors.acceptPrivacy = "Acepta la politica de privacidad.";
  }

  return { success: Object.keys(errors).length === 0, errors };
}
