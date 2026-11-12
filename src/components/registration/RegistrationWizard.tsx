"use client";

import { FormStep } from "@/components/registration/FormStep";
import { LegalAcceptance } from "@/components/registration/LegalAcceptance";
import { ProgressIndicator } from "@/components/registration/ProgressIndicator";
import { RegistrationReview } from "@/components/registration/RegistrationReview";
import { FormField, inputClassName, selectClassName } from "@/components/ui/FormField";
import { ageAtEventDate } from "@/lib/age";
import {
  BLOOD_TYPES,
  CATEGORIES,
  COLOMBIAN_DEPARTMENTS,
  DOCUMENT_TYPES,
  EVENT,
  JERSEY_DESIGNS,
  JERSEY_SIZES,
  NATIONALITIES,
  REGISTRATION_SUBMIT_ERROR,
  REGISTRATION_SUBMIT_SUCCESS,
  UPLOAD,
} from "@/lib/config/event";
import {
  inscriptionHref,
  isValidCategoryId,
  parseInscriptionParams,
} from "@/lib/navigation/inscriptionLinks";
import { toRegistrationPayloadJson } from "@/lib/registration/serializeRegistrationPayload";
import { getVisibleSteps } from "@/lib/registration/visibleSteps";
import {
  defaultRegistrationValues,
  validateRegistrationStep,
  type RegistrationFormValues,
} from "@/lib/validation/registrationSchema";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { useSearchParams } from "next/navigation";

export function RegistrationWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegistrationFormValues, string>>
  >({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegistrationFormValues>({
    defaultValues: defaultRegistrationValues,
    mode: "onSubmit",
    shouldUnregister: false,
  });

  const values = form.watch();
  const register = form.register;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const { categoria, jersey } = parseInscriptionParams(searchParams, hash);

    if (isValidCategoryId(categoria)) {
      form.setValue("category", categoria);
      setStep(1);
    }
    if (jersey) {
      form.setValue("registrationOption", "free_with_jersey");
    }

    if (hash.startsWith("#inscripcion")) {
      const normalized = inscriptionHref({
        categoria: isValidCategoryId(categoria) ? categoria : undefined,
        jersey: jersey || undefined,
      });
      window.history.replaceState(null, "", normalized);
      window.scrollTo(0, 0);
    }
  }, [form, searchParams]);

  const visibleSteps = useMemo(() => getVisibleSteps(values), [values]);

  useEffect(() => {
    if (!visibleSteps.includes(step)) {
      setStep(visibleSteps[visibleSteps.length - 1] ?? 1);
    }
  }, [visibleSteps, step]);

  const ageAtEvent = ageAtEventDate(values.birthDate);

  const setErrors = useCallback(
    (errors: Partial<Record<keyof RegistrationFormValues, string>>) => {
      setFieldErrors(errors);
      (Object.keys(errors) as (keyof RegistrationFormValues)[]).forEach((key) => {
        form.setError(key, { type: "manual", message: errors[key] });
      });
    },
    [form],
  );

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    form.clearErrors();
  }, [form]);

  const err = (name: keyof RegistrationFormValues) =>
    fieldErrors[name] ?? form.formState.errors[name]?.message;

  const goNext = () => {
    clearErrors();
    if (EVENT.registrationStepValidationEnabled) {
      const result = validateRegistrationStep(step, values);
      if (!result.success) {
        setErrors(result.errors);
        return;
      }
    }
    const idx = visibleSteps.indexOf(step);
    if (idx < visibleSteps.length - 1) setStep(visibleSteps[idx + 1]);
  };

  const goBack = () => {
    clearErrors();
    const idx = visibleSteps.indexOf(step);
    if (idx > 0) setStep(visibleSteps[idx - 1]);
  };

  const onAttemptConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    clearErrors();
    setStatusMessage(null);
    if (EVENT.registrationStepValidationEnabled) {
      for (const s of visibleSteps) {
        if (s === 9) continue;
        const check = validateRegistrationStep(s, values);
        if (!check.success) {
          setErrors(check.errors);
          setStep(s);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("payload", JSON.stringify(toRegistrationPayloadJson(values)));
      const receipt = values.paymentReceipt?.[0];
      if (receipt) body.append("paymentReceipt", receipt);
      const guardian = values.guardianAuthorization?.[0];
      if (guardian) body.append("guardianAuthorization", guardian);

      const response = await fetch("/api/registrations/notify", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        setStatusMessage(REGISTRATION_SUBMIT_ERROR);
        return;
      }
      setStatusMessage(REGISTRATION_SUBMIT_SUCCESS);
    } catch {
      setStatusMessage(REGISTRATION_SUBMIT_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const copyNequi = () => {
    void navigator.clipboard?.writeText(EVENT.paymentNequi);
  };

  return (
    <section id="inscripcion" className="bg-graphite py-20 sm:py-24" aria-labelledby="inscripcion-title">
      <div className="section-shell">
        <p className="section-kicker">Inscripcion</p>
        <h2 id="inscripcion-title" className="section-title mt-3">
          INSCRIBETE A MANIZALES EPIC RACE
        </h2>
        <p className="mt-3 text-muted">
          {EVENT.dateLabel} | {EVENT.registrationFreeLabel}
        </p>

        <form onSubmit={onAttemptConfirm} className="card-surface mt-10 space-y-8 p-6 sm:p-10" noValidate>
          <ProgressIndicator currentStep={step} visibleSteps={visibleSteps} />

          {step === 1 && (
            <FormStep title="Datos del participante" description="Campos con * son obligatorios.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="firstName" label="Nombres" required error={err("firstName")}>
                  <input id="firstName" className={inputClassName} {...register("firstName")} />
                </FormField>
                <FormField id="lastName" label="Apellidos" required error={err("lastName")}>
                  <input id="lastName" className={inputClassName} {...register("lastName")} />
                </FormField>
                <FormField id="documentType" label="Tipo documento" required error={err("documentType")}>
                  <select id="documentType" className={selectClassName} {...register("documentType")}>
                    <option value="">Seleccione</option>
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="documentNumber" label="Numero documento" required error={err("documentNumber")}>
                  <input id="documentNumber" className={inputClassName} {...register("documentNumber")} />
                </FormField>
                <FormField
                  id="birthDate"
                  label="Fecha nacimiento"
                  required
                  error={err("birthDate")}
                  hint={
                    ageAtEvent !== null
                      ? `Edad al ${EVENT.dateIso}: ${ageAtEvent} anos`
                      : "Edad calculada al 13/12/2026"
                  }
                >
                  <input id="birthDate" type="date" className={inputClassName} {...register("birthDate")} />
                </FormField>
                <FormField id="sex" label="Sexo" required error={err("sex")}>
                  <select id="sex" className={selectClassName} {...register("sex")}>
                    <option value="">Seleccione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </FormField>
                <FormField id="nationality" label="Nacionalidad" required error={err("nationality")}>
                  <select id="nationality" className={selectClassName} {...register("nationality")}>
                    {NATIONALITIES.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="residenceDepartment" label="Departamento" required error={err("residenceDepartment")}>
                  <select id="residenceDepartment" className={selectClassName} {...register("residenceDepartment")}>
                    <option value="">Seleccione</option>
                    {COLOMBIAN_DEPARTMENTS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="residenceMunicipality" label="Municipio" required error={err("residenceMunicipality")}>
                  <input id="residenceMunicipality" className={inputClassName} {...register("residenceMunicipality")} />
                </FormField>
                <FormField id="residenceAddress" label="Direccion" required error={err("residenceAddress")} className="sm:col-span-2">
                  <input id="residenceAddress" className={inputClassName} {...register("residenceAddress")} />
                </FormField>
                <FormField id="phone" label="Celular" required error={err("phone")}>
                  <input id="phone" type="tel" className={inputClassName} {...register("phone")} />
                </FormField>
                <FormField id="email" label="Correo" required error={err("email")}>
                  <input id="email" type="email" className={inputClassName} {...register("email")} />
                </FormField>
                <FormField id="clubOrTeam" label="Club o equipo" className="sm:col-span-2">
                  <input id="clubOrTeam" className={inputClassName} {...register("clubOrTeam")} />
                </FormField>
                <FormField id="category" label="Categoria" required error={err("category")}>
                  <select id="category" className={selectClassName} {...register("category")}>
                    <option value="">Seleccione</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </FormStep>
          )}

          {step === 3 && (
            <FormStep title="Informacion de salud">
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted">
                Esta informacion es sensible y se usa para atencion en emergencia. No se mostrara en el resumen
                publico. El texto de autorizacion esta sujeto a validacion juridica antes de inscripciones reales.
              </p>
              <FormField id="eps" label="EPS" required error={err("eps")}>
                <input id="eps" className={inputClassName} {...register("eps")} />
              </FormField>
              <FormField id="bloodType" label="Grupo sanguineo" required error={err("bloodType")}>
                <select id="bloodType" className={selectClassName} {...register("bloodType")}>
                  <option value="">Seleccione</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </FormField>
              <YesNoBlock
                label="Condicion de salud"
                required
                value={values.hasHealthCondition}
                name="hasHealthCondition"
                detailName="healthConditionDetail"
                register={register}
                err={err}
              />
              <YesNoBlock
                label="Alergias"
                required
                value={values.hasAllergies}
                name="hasAllergies"
                detailName="allergiesDetail"
                register={register}
                err={err}
              />
              <YesNoBlock
                label="Medicamentos"
                required
                value={values.takesMedication}
                name="takesMedication"
                detailName="medicationDetail"
                register={register}
                err={err}
              />
              <div>
                <label htmlFor="authorizeHealthData" className="flex cursor-pointer gap-3 text-sm text-white">
                  <input
                    id="authorizeHealthData"
                    type="checkbox"
                    className="focus-ring mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-carbon text-epic-orange"
                    {...register("authorizeHealthData")}
                  />
                  <span>
                    Autorizo expresamente el tratamiento de mis datos de salud para emergencia durante el evento
                    (sujeto a texto definitivo aprobado por la organizacion).
                    <span className="text-epic-orange"> *</span>
                  </span>
                </label>
                {err("authorizeHealthData") ? (
                  <p className="mt-1 text-sm text-red-400" role="alert">
                    {err("authorizeHealthData")}
                  </p>
                ) : null}
              </div>
            </FormStep>
          )}

          {step === 4 && (
            <FormStep title="Contacto de emergencia">
              <FormField id="emergencyName" label="Nombre" required error={err("emergencyName")}>
                <input id="emergencyName" className={inputClassName} {...register("emergencyName")} />
              </FormField>
              <FormField id="emergencyRelationship" label="Parentesco" required error={err("emergencyRelationship")}>
                <input id="emergencyRelationship" className={inputClassName} {...register("emergencyRelationship")} />
              </FormField>
              <FormField id="emergencyPhone" label="Celular" required error={err("emergencyPhone")}>
                <input id="emergencyPhone" type="tel" className={inputClassName} {...register("emergencyPhone")} />
              </FormField>
              <FormField id="emergencyPhoneSecondary" label="Segundo telefono" error={err("emergencyPhoneSecondary")}>
                <input id="emergencyPhoneSecondary" type="tel" className={inputClassName} {...register("emergencyPhoneSecondary")} />
              </FormField>
            </FormStep>
          )}

          {step === 5 && (
            <FormStep title="Inscripcion y jersey">
              <div className="grid gap-4 md:grid-cols-2">
                <OptionCard
                  active={values.registrationOption === "free_only"}
                  title="Opcion A - Solo inscripcion"
                  price="$0"
                  description="Sin jersey"
                  onSelect={() => form.setValue("registrationOption", "free_only")}
                />
                <OptionCard
                  active={values.registrationOption === "free_with_jersey"}
                  title="Opcion B - Con jersey"
                  price={EVENT.jerseyPriceLabel}
                  description="Jersey naranja: Niebla o Ciudad"
                  onSelect={() => form.setValue("registrationOption", "free_with_jersey")}
                />
              </div>
              {err("registrationOption") ? <p className="text-sm text-red-400">{err("registrationOption")}</p> : null}
              {values.registrationOption === "free_with_jersey" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField id="jerseyDesign" label="Diseno del jersey" required error={err("jerseyDesign")}>
                    <select id="jerseyDesign" className={selectClassName} {...register("jerseyDesign")}>
                      <option value="">Seleccione</option>
                      {JERSEY_DESIGNS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="jerseySize" label="Talla" required error={err("jerseySize")}>
                    <select id="jerseySize" className={selectClassName} {...register("jerseySize")}>
                      <option value="">Seleccione</option>
                      {JERSEY_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="jerseySleeve" label="Manga" required error={err("jerseySleeve")}>
                    <select id="jerseySleeve" className={selectClassName} {...register("jerseySleeve")}>
                      <option value="">Seleccione</option>
                      <option value="short">Corta</option>
                      <option value="long">Larga</option>
                    </select>
                  </FormField>
                  <FormField id="jerseyCut" label="Corte" required error={err("jerseyCut")}>
                    <select id="jerseyCut" className={selectClassName} {...register("jerseyCut")}>
                      <option value="">Seleccione</option>
                      <option value="road">Ruta</option>
                      <option value="mtb">MTB</option>
                    </select>
                  </FormField>
                </div>
              )}
            </FormStep>
          )}

          {step === 6 && (
            <FormStep title="Pago del jersey">
              <p className="text-sm">
                Valor: {EVENT.jerseyPriceLabel}. {EVENT.paymentMethodsLabel}:{" "}
                <span className="font-semibold text-white">{EVENT.paymentKeyDisplay}</span>
              </p>
              {!EVENT.paymentDestinationConfirmed ? (
                <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                  La informacion del destino de pago esta pendiente de confirmacion oficial. Verifique con la
                  organizacion antes de transferir.
                </p>
              ) : null}
              <button type="button" onClick={copyNequi} className="focus-ring rounded-lg border border-epic-orange/40 px-4 py-2 text-sm">
                Copiar numero ({EVENT.paymentMethodsLabel})
              </button>
              <FormField id="paymentReceipt" label="Comprobante (JPG, PNG o PDF)" required error={err("paymentReceipt")}>
                <input id="paymentReceipt" type="file" accept={UPLOAD.accept} className={inputClassName} {...register("paymentReceipt")} />
              </FormField>
            </FormStep>
          )}

          {step === 7 && (
            <FormStep title="Representante legal">
              <p className="text-sm text-muted">
                {EVENT.minorsEnabled
                  ? "Complete datos del representante."
                  : "Inscripcion de menores no habilitada en esta fase."}
              </p>
            </FormStep>
          )}

          {step === 8 && (
            <FormStep title="Aceptaciones legales">
              <LegalAcceptance register={register} getError={err} />
            </FormStep>
          )}

          {step === 9 && (
            <FormStep title="Revision y confirmacion">
              <RegistrationReview values={values} devMessage={statusMessage} />
            </FormStep>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
            <button type="button" onClick={goBack} disabled={visibleSteps.indexOf(step) === 0} className="focus-ring rounded-full border border-white/20 px-6 py-3 text-sm font-semibold disabled:opacity-40">
              Volver
            </button>
            {step < 9 ? (
              <button type="button" onClick={goNext} className="focus-ring rounded-full bg-epic-orange px-8 py-3 text-sm font-bold uppercase text-white">
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="focus-ring rounded-full bg-epic-orange px-8 py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Confirmar inscripcion gratuita"}
              </button>
            )}
          </div>
          {statusMessage ? (
            <p className="text-center text-sm text-epic-orange-light">{statusMessage}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function YesNoBlock({
  label,
  name,
  value,
  detailName,
  register,
  err,
  required,
}: {
  label: string;
  name: keyof RegistrationFormValues;
  value?: string;
  detailName: keyof RegistrationFormValues;
  register: UseFormRegister<RegistrationFormValues>;
  err: (n: keyof RegistrationFormValues) => string | undefined;
  required?: boolean;
}) {
  const choiceError = err(name);
  return (
    <div className="space-y-3 rounded-xl border border-white/10 p-4">
      <p className="text-sm font-medium text-white">
        {label}
        {required ? <span className="text-epic-orange"> *</span> : null}
      </p>
      <div className="flex gap-4 text-sm text-white">
        <label className="flex items-center gap-2">
          <input type="radio" value="yes" {...register(name)} /> Si
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="no" {...register(name)} /> No
        </label>
      </div>
      {choiceError ? <p className="text-sm text-red-400">{choiceError}</p> : null}
      {value === "yes" && (
        <FormField id={String(detailName)} label="Descripcion" required error={err(detailName)}>
          <textarea id={String(detailName)} rows={3} className={inputClassName} {...register(detailName)} />
        </FormField>
      )}
    </div>
  );
}

function OptionCard({
  active,
  title,
  price,
  description,
  onSelect,
}: {
  active: boolean;
  title: string;
  price: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`focus-ring rounded-2xl border p-5 text-left ${active ? "border-epic-orange bg-epic-orange/10" : "border-white/15 bg-carbon/50"}`}
    >
      <p className="font-display text-xl text-white">{title}</p>
      <p className="mt-2 text-epic-orange">{price}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </button>
  );
}
