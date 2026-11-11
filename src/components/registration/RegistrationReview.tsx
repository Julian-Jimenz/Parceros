"use client";



import { categoryLabel } from "@/components/landing/CategoryCards";

import { EVENT, jerseyDesignLabel, type CategoryId } from "@/lib/config/event";

import { maskDocumentNumber } from "@/lib/masking";

import type { RegistrationFormValues } from "@/lib/validation/registrationSchema";



type Props = {

  values: RegistrationFormValues;

  devMessage: string | null;

};



export function RegistrationReview({ values, devMessage }: Props) {

  const withJersey = values.registrationOption === "free_with_jersey";

  const category =

    values.category && isCategoryId(values.category)

      ? categoryLabel(values.category)

      : "-";



  return (

    <div className="space-y-6">

      <p className="text-sm text-muted">

        Resumen sin datos sensibles de salud.

      </p>

      <dl className="grid gap-4 sm:grid-cols-2">

        <ReviewItem label="Nombre" value={`${values.firstName} ${values.lastName}`.trim()} />

        <ReviewItem

          label="Documento"

          value={

            values.documentNumber

              ? `${values.documentType} ${maskDocumentNumber(values.documentNumber)}`

              : "-"

          }

        />

        <ReviewItem label="Categoria" value={category} />

        <ReviewItem

          label="Modalidad"

          value={withJersey ? "Inscripcion gratuita + jersey" : "Inscripcion gratuita"}

        />

        {withJersey ? (

          <>

            <ReviewItem

              label="Jersey"

              value={`${jerseyDesignLabel(values.jerseyDesign ?? "")} / Talla ${values.jerseySize || "-"} / ${

                values.jerseySleeve === "long"

                  ? "Manga larga"

                  : values.jerseySleeve === "short"

                    ? "Manga corta"

                    : "-"

              } / ${values.jerseyCut === "mtb" ? "MTB" : values.jerseyCut === "road" ? "Ruta" : "-"}`}

            />

            <ReviewItem label="Valor jersey" value={EVENT.jerseyPriceLabel} />

          </>

        ) : null}

        <ReviewItem

          label="Autorizacion datos de salud"

          value={values.authorizeHealthData ? "Autorizado" : "Pendiente"}

        />

        {!EVENT.legalDocumentsPublished ? (

          <ReviewItem

            label="Aceptaciones legales"

            value="Pendientes de publicacion de documentos oficiales"

            className="sm:col-span-2"

          />

        ) : null}

      </dl>

      {devMessage ? (

        <div

          className="rounded-xl border border-epic-orange/40 bg-epic-orange/10 px-4 py-3 text-sm text-white"

          role="status"

        >

          {devMessage}

        </div>

      ) : null}

    </div>

  );

}



function ReviewItem({

  label,

  value,

  className,

}: {

  label: string;

  value: string;

  className?: string;

}) {

  return (

    <div className={`rounded-xl border border-white/10 bg-carbon/60 px-4 py-3 ${className ?? ""}`}>

      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>

      <dd className="mt-1 text-sm font-medium text-white">{value}</dd>

    </div>

  );

}



function isCategoryId(value: string): value is CategoryId {

  return (

    value === "open-hombres" ||

    value === "open-mujeres" ||

    value === "recreativa-hombres" ||

    value === "recreativa-mujeres"

  );

}

