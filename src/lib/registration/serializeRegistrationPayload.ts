import type { RegistrationFormValues } from "@/lib/validation/registrationSchema";

/** Datos enviables por JSON (sin archivos). */
export type RegistrationPayloadJson = Omit<
  RegistrationFormValues,
  "paymentReceipt" | "guardianAuthorization"
> & {
  paymentReceiptFileName?: string;
  guardianAuthorizationFileName?: string;
};

export function toRegistrationPayloadJson(
  values: RegistrationFormValues,
): RegistrationPayloadJson {
  const { paymentReceipt, guardianAuthorization, ...rest } = values;
  return {
    ...rest,
    paymentReceiptFileName: paymentReceipt?.[0]?.name,
    guardianAuthorizationFileName: guardianAuthorization?.[0]?.name,
  };
}
