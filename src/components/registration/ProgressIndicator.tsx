"use client";

import { FORM_STEPS } from "@/lib/config/event";
import { clsx } from "clsx";

type ProgressIndicatorProps = {
  currentStep: number;
  visibleSteps: number[];
};

export function ProgressIndicator({ currentStep, visibleSteps }: ProgressIndicatorProps) {
  const currentIndex = visibleSteps.indexOf(currentStep);
  const progress =
    visibleSteps.length > 1
      ? Math.round(((currentIndex + 1) / visibleSteps.length) * 100)
      : 0;

  return (
    <div className="space-y-4" aria-label="Progreso del formulario">
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <span>
          Paso {currentIndex + 1} de {visibleSteps.length}
        </span>
        <span className="font-medium text-epic-orange-light">{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-epic-orange to-epic-orange-light transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <ol className="hidden gap-2 lg:grid lg:grid-cols-3">
        {visibleSteps.map((stepId) => {
          const meta = FORM_STEPS.find((s) => s.id === stepId);
          const active = stepId === currentStep;
          const done = visibleSteps.indexOf(stepId) < currentIndex;
          return (
            <li
              key={stepId}
              className={clsx(
                "rounded-lg border px-3 py-2 text-xs",
                active
                  ? "border-epic-orange/60 bg-epic-orange/10 text-white"
                  : done
                    ? "border-white/15 text-muted"
                    : "border-white/10 text-muted/80",
              )}
            >
              {meta?.title ?? `Paso ${stepId}`}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
