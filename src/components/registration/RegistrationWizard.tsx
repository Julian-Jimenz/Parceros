"use client";

import { FormStep } from "@/components/registration/FormStep";
import { LegalAcceptance } from "@/components/registration/LegalAcceptance";
import { ProgressIndicator } from "@/components/registration/ProgressIndicator";
import { RegistrationReview } from "@/components/registration/RegistrationReview";
import { FormField, inputClassName, selectClassName } from "@/components/ui/FormField";
import { ageAtEventDate } from "@/lib/age";
import {
  BICYCLE_TYPES_BY_CATEGORY,
  BLOOD_TYPES,
  CATEGORIES,
  COLOMBIAN_DEPARTMENTS,
  DOCUMENT_TYPES,
  EVENT,
  JERSEY_SIZES,
  NATIONALITIES,
  REGISTRATION_DEV_MESSAGE,
  UPLOAD,
  type CategoryId,
} from "@/lib/config/event";
import {
  inscriptionHref,
  isValidCategoryId,
  parseInscriptionParams,
} from "@/lib/navigation/inscriptionLinks";
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
  const [devMessage, setDevMessage] = useState<string | null>(null);

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
      setStep(2);
    }
    if (jersey) {
      form.setValue("registrationOption", "free_with_jersey");
    }

    if (hash.startsWith("#inscripcion?")) {
      const normalized = inscriptionHref({
        categoria: isValidCategoryId(categoria) ? categoria : undefined,
        jersey: jersey || undefined,
      });
      window.history.replaceState(null, "", normalized);
    }

    if (categoria || jersey) {
      requestAnimationFrame(() => {
        document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [form, searchParams]);

  const visibleSteps = useMemo(() => getVisibleSteps(values), [values]);

  useEffect(() => {
    if (!visibleSteps.includes(step)) {
      setStep(visibleSteps[visibleSteps.length - 1] ?? 1);
    }
  }, [visibleSteps, step]);

  const ageAtEvent = ageAtEventDate(values.birthDate);

  const bicycleOptions = useMemo(() => {
    const cat = values.category as CategoryId;
    if (!cat) return [];
    return BICYCLE_TYPES_BY_CATEGORY[cat] ?? [];
  }, [values.category]);

  useEffect(() => {
    if (values.bicycleType && !bicycleOptions.includes(values.bicycleType)) {
      form.setValue("bicycleType", "");
    }
  }, [bicycleOptions, form, values.bicycleType]);

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
    const result = validateRegistrationStep(step, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    const idx = visibleSteps.indexOf(step);
    if (idx < visibleSteps.length - 1) setStep(visibleSteps[idx + 1]);
  };

  const goBack = () => {
    clearErrors();
    const idx = visibleSteps.indexOf(step);
    if (idx > 0) setStep(visibleSteps[idx - 1]);
  };

  const onAttemptConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    clearErrors();
    for (const s of visibleSteps) {
      if (s === 9) continue;
      const check = validateRegistrationStep(s, values);
      if (!check.success) {
        setErrors(check.errors);
        setStep(s);
        return;
      }
    }
    setDevMessage(REGISTRATION_DEV_MESSAGE);
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
              </div>
            </FormStep>
          )}

          {step === 2 && (
            <FormStep title="Categoria y bicicleta">
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
              <FormField id="bicycleType" label="Tipo bicicleta" required error={err("bicycleType")}>
                <select
                  id="bicycleType"
                  className={selectClassName}
                  disabled={bicycleOptions.length === 0}
                  {...register("bicycleType")}
                >
                  <option value="">
                    {bicycleOptions.length === 0 ? "Pendiente configuracion admin" : "Seleccione"}
                  </option>
                  {bicycleOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </FormField>
            </FormStep>
          )}

          {step === 3 && (
            <FormStep title="Informacion de salud">
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted">
                Datos sensibles para emergencia. Uso segun autorizaciones legales.
              </p>
              <label className="flex gap-3 text-sm text-white">
                <input type="checkbox" className="focus-ring mt-1" {...register("healthNoticeAccepted")} />
                <span>
                  He leido el aviso <span className="text-epic-orange">*</span>
                </span>
              </label>
              {err("healthNoticeAccepted") ? <p className="text-sm text-red-400">{err("healthNoticeAccepted")}</p> : null}
              <FormField id="eps" label="EPS">
                <input id="eps" className={inputClassName} {...register("eps")} />
              </FormField>
              <FormField id="bloodType" label="Grupo sanguineo">
                <select id="bloodType" className={selectClassName} {...register("bloodType")}>
                  <option value="">Seleccione</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </FormField>
              <YesNoBlock label="Condicion de salud" value={values.hasHealthCondition} name="hasHealthCondition" detailName="healthConditionDetail" register={register} err={err} />
              <YesNoBlock label="Alergias" value={values.hasAllergies} name="hasAllergies" detailName="allergiesDetail" register={register} err={err} />
              <YesNoBlock label="Medicamentos" value={values.takesMedication} name="takesMedication" detailName="medicationDetail" register={register} err={err} />
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
                  description="Jersey naranja oficial"
                  onSelect={() => form.setValue("registrationOption", "free_with_jersey")}
                />
              </div>
              {err("registrationOption") ? <p className="text-sm text-red-400">{err("registrationOption")}</p> : null}
              {values.registrationOption === "free_with_jersey" && (
                <div className="grid gap-4 sm:grid-cols-3">
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
                Valor: {EVENT.jerseyPriceLabel}. Nequi: {EVENT.paymentNequi}. Beneficiario: {EVENT.paymentBeneficiary}
              </p>
              <button type="button" onClick={copyNequi} className="focus-ring rounded-lg border border-epic-orange/40 px-4 py-2 text-sm">
                Copiar numero Nequi
              </button>
              <FormField id="payerName" label="Quien pago" required error={err("payerName")}>
                <input id="payerName" className={inputClassName} {...register("payerName")} />
              </FormField>
              <FormField id="paymentDate" label="Fecha pago" required error={err("paymentDate")}>
                <input id="paymentDate" type="date" className={inputClassName} {...register("paymentDate")} />
              </FormField>
              <FormField id="paymentReference" label="Referencia" required error={err("paymentReference")}>
                <input id="paymentReference" className={inputClassName} {...register("paymentReference")} />
              </FormField>
              <FormField id="paymentReceipt" label="Comprobante" required error={err("paymentReceipt")}>
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
            <FormStep title="Aceptaciones">
              <LegalAcceptance register={register} getError={err} />
            </FormStep>
          )}

          {step === 9 && (
            <FormStep title="Revision">
              <RegistrationReview values={values} devMessage={devMessage} />
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
              <button type="submit" className="focus-ring rounded-full bg-epic-orange px-8 py-3 text-sm font-bold uppercase text-white">
                Confirmar inscripcion gratuita
              </button>
            )}
          </div>
          {devMessage ? <p className="text-center text-sm text-epic-orange-light">{devMessage}</p> : null}
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
}: {
  label: string;
  name: keyof RegistrationFormValues;
  value?: string;
  detailName: keyof RegistrationFormValues;
  register: UseFormRegister<RegistrationFormValues>;
  err: (n: keyof RegistrationFormValues) => string | undefined;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 p-4">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="flex gap-4 text-sm text-white">
        <label className="flex items-center gap-2">
          <input type="radio" value="yes" {...register(name)} /> Si
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="no" {...register(name)} /> No
        </label>
      </div>
      {value === "yes" && (
        <FormField id={String(detailName)} label="Descripcion" error={err(detailName)}>
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
