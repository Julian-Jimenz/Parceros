"use client";

import type { RegistrationFormValues } from "@/lib/validation/registrationSchema";
import type { UseFormRegister } from "react-hook-form";

const DRAFT =
  "BORRADOR - no aprobado legalmente. Placeholder hasta validaci\u00F3n de la organizaci\u00F3n.";

const legalDocs = [
  { id: "regulation", title: "Reglamento del evento", excerpt: DRAFT },
  { id: "risk", title: "Declaraci\u00F3n de riesgos", excerpt: DRAFT },
  {
    id: "privacy",
    title: "Pol\u00EDtica de privacidad",
    excerpt: "BORRADOR - Ley 1581 de 2012 (texto oficial pendiente).",
  },
];

type Props = {
  register: UseFormRegister<RegistrationFormValues>;
  getError: (name: keyof RegistrationFormValues) => string | undefined;
};

export function LegalAcceptance({ register, getError }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {legalDocs.map((doc) => (
          <details
            key={doc.id}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <summary className="cursor-pointer font-medium text-white">{doc.title}</summary>
            <p className="mt-3 text-sm text-muted">{doc.excerpt}</p>
          </details>
        ))}
      </div>
      <CheckboxField
        id="infoCorrect"
        label="Confirmo que la informaci\u00F3n registrada es correcta."
        required
        register={register("infoCorrect")}
        error={getError("infoCorrect")}
      />
      <CheckboxField
        id="acceptRegulation"
        label="He le\u00EDdo y acepto el reglamento (borrador)."
        required
        register={register("acceptRegulation")}
        error={getError("acceptRegulation")}
      />
      <CheckboxField
        id="acceptRiskWaiver"
        label="He le\u00EDdo y acepto la declaraci\u00F3n de riesgos."
        required
        register={register("acceptRiskWaiver")}
        error={getError("acceptRiskWaiver")}
      />
      <CheckboxField
        id="acceptPrivacy"
        label="Autorizo el tratamiento de datos conforme a la pol\u00EDtica de privacidad (borrador)."
        required
        register={register("acceptPrivacy")}
        error={getError("acceptPrivacy")}
      />
      <CheckboxField
        id="authorizeHealthData"
        label="Autorizo el tratamiento de datos de salud para emergencia (opcional)."
        register={register("authorizeHealthData")}
      />
      <CheckboxField
        id="authorizeImageUse"
        label="Autorizo el uso de mi imagen para divulgar el evento."
        register={register("authorizeImageUse")}
      />
      <CheckboxField
        id="subscribeEvents"
        label="Deseo recibir informaci\u00F3n sobre pr\u00F3ximos eventos."
        register={register("subscribeEvents")}
      />
    </div>
  );
}

function CheckboxField({
  id,
  label,
  required,
  register,
  error,
}: {
  id: string;
  label: string;
  required?: boolean;
  register: ReturnType<UseFormRegister<RegistrationFormValues>>;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer gap-3 text-sm text-white">
        <input
          id={id}
          type="checkbox"
          className="focus-ring mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-carbon text-epic-orange"
          {...register}
        />
        <span>
          {label}
          {required ? <span className="text-epic-orange"> *</span> : null}
        </span>
      </label>
      {error ? (
        <p className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
