import { UPLOAD } from "@/lib/config/event";
import { z } from "zod";

export function fileUploadSchema(required: boolean) {
  const base = z.custom<FileList | undefined>().transform((files) => files?.[0]);

  if (!required) {
    return base
      .optional()
      .refine(
        (file) =>
          !file || (UPLOAD.mimeTypes as readonly string[]).includes(file.type),
        "Formato no permitido. Use JPG, PNG o PDF.",
      )
      .refine(
        (file) => !file || file.size <= UPLOAD.maxBytes,
        "El archivo supera el tamano maximo permitido (5 MB).",
      );
  }

  return base
    .refine((file): file is File => file instanceof File, "Debe adjuntar un archivo.")
    .refine(
      (file) => (UPLOAD.mimeTypes as readonly string[]).includes(file.type),
      "Formato no permitido. Use JPG, PNG o PDF.",
    )
    .refine(
      (file) => file.size <= UPLOAD.maxBytes,
      "El archivo supera el tamano maximo permitido (5 MB).",
    );
}
