"use client";

import { EVENT } from "@/lib/config/event";
import type { RegistrationFormValues } from "@/lib/validation/registrationSchema";
import type { UseFormRegister } from "react-hook-form";

const legalDocs = [
  {
    id: "regulation",
    title: "Reglamento del evento",
    excerpt:
      "Documento no publicado. No disponible para aceptacion definitiva hasta aprobacion de la organizacion.",
  },
  {
    id: "risk",
    title: "Declaracion de riesgos y exoneracion",
    excerpt:
      "Documento no publicado. No disponible para aceptacion definitiva hasta aprobacion legal.",
  },
  {
    id: "privacy",
    title: "Politica de privacidad y tratamiento de datos personales",
    excerpt:
      "Documento no publicado (Ley 1581 de 2012). No disponible para aceptacion definitiva.",
  },
];

type Props = {
  register: UseFormRegister<RegistrationFormValues>;
  getError: (name: keyof RegistrationFormValues) => string | undefined;
};

export function LegalAcceptance({ register, getError }: Props) {
  const published = EVENT.legalDocumentsPublished;

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
        {published
          ? "Revise cada documento publicado antes de continuar."
          : "Los documentos legales estan en revision. No puede realizarse una aceptacion definitiva en esta fase. Cuando la organizacion publique las versiones oficiales, este paso exigira su confirmacion."}
      </p>
      <div className="grid gap-4">
        {legalDocs.map((doc) => (
          <details
            key={doc.id}
            className="rounded-xl border border-white/10 bg-carbon/40 p-4"
            open={false}
          >
            <summary className="cursor-pointer font-medium text-white">
              {doc.title}
              {!published ? (
                <span className="ml-2 text-xs font-normal text-amber-200">(pendiente)</span>
              ) : null}
            </summary>
            <p className="mt-3 text-sm text-muted">{doc.excerpt}</p>
          </details>
        ))}
      </div>

      <fieldset
        className="space-y-5"
        disabled={!published}
        aria-disabled={!published}
      >
        <legend className="sr-only">Aceptaciones legales</legend>
        {!published ? (
          <p className="text-sm text-muted">
            Las casillas de aceptacion obligatoria permanecen deshabilitadas hasta la publicacion de los
            textos aprobados.
          </p>
        ) : null}
        <CheckboxField
          id="infoCorrect"
          label="Confirmo que la informacion registrada es correcta."
          required={published}
          register={register("infoCorrect")}
          error={getError("infoCorrect")}
        />
        <CheckboxField
          id="acceptRegulation"
          label="He leido y acepto el reglamento del evento."
          required={published}
          register={register("acceptRegulation")}
          error={getError("acceptRegulation")}
        />
        <CheckboxField
          id="acceptRiskWaiver"
          label="He leido y acepto la declaracion de riesgos y exoneracion."
          required={published}
          register={register("acceptRiskWaiver")}
          error={getError("acceptRiskWaiver")}
        />
        <CheckboxField
          id="acceptPrivacy"
          label="Autorizo el tratamiento de mis datos personales conforme a la politica de privacidad."
          required={published}
          register={register("acceptPrivacy")}
          error={getError("acceptPrivacy")}
        />
      </fieldset>

      <div className="border-t border-white/10 pt-5 space-y-5">
        <p className="text-xs uppercase tracking-wide text-muted">Opcionales</p>
        <CheckboxField
          id="authorizeImageUse"
          label="Autorizo el uso de mi imagen para divulgar el evento."
          register={register("authorizeImageUse")}
        />
        <CheckboxField
          id="subscribeEvents"
          label="Deseo recibir informacion sobre proximos eventos."
          register={register("subscribeEvents")}
        />
      </div>
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
          className="focus-ring mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-carbon text-epic-orange disabled:opacity-40"
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
