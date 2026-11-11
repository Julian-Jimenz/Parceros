import type { ReactNode } from "react";

type FormStepProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormStep({ title, description, children }: FormStepProps) {
  return (
  <div className="space-y-6">
    <div>
      <h3 className="font-display text-3xl tracking-wide text-white">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
  );
}
