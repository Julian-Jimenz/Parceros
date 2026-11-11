"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={clsx("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-white">
        {label}
        {required ? <span className="text-epic-orange"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName =
  "focus-ring w-full min-h-11 rounded-xl border border-white/15 bg-carbon px-4 py-3 text-base text-white placeholder:text-muted";

export const selectClassName = inputClassName;
