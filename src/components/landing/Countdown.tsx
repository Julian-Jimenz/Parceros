"use client";

import { EVENT } from "@/lib/config/event";
import { useEffect, useMemo, useState } from "react";

type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function resolveCountdownTargetIso(): string {
  if (EVENT.eventStartTimeConfirmed && EVENT.eventStartTimeIso) {
    return EVENT.eventStartTimeIso;
  }
  return EVENT.countdownTargetIso;
}

function getParts(targetMs: number): TimeParts | null {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function formatEventDateLabel(): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: EVENT.timezone,
    dateStyle: "full",
  }).format(new Date(`${EVENT.dateIso}T12:00:00`));
}

export function Countdown() {
  const targetIso = resolveCountdownTargetIso();
  const targetMs = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [parts, setParts] = useState<TimeParts | null>(() => getParts(targetMs));

  useEffect(() => {
    const id = window.setInterval(() => setParts(getParts(targetMs)), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const items =
    parts === null
      ? [{ label: "Evento en curso o finalizado", value: "-" }]
      : [
          { label: "D\u00EDas", value: String(parts.days).padStart(2, "0") },
          { label: "Horas", value: String(parts.hours).padStart(2, "0") },
          { label: "Min", value: String(parts.minutes).padStart(2, "0") },
          { label: "Seg", value: String(parts.seconds).padStart(2, "0") },
        ];

  return (
    <section className="section-shell -mt-10 relative z-10 pb-8" aria-labelledby="countdown-heading">
      <div className="card-surface bg-topo-pattern p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Cuenta regresiva</p>
            <h2 id="countdown-heading" className="mt-2 font-display text-3xl text-white sm:text-4xl">
              FALTAN PARA EL EVENTO
            </h2>
            <p className="mt-2 text-sm text-muted">
              Fecha del evento: {formatEventDateLabel()} ({EVENT.timezone})
            </p>
            {!EVENT.eventStartTimeConfirmed ? (
              <p className="mt-1 text-sm text-epic-orange-light">
                {`Hora de salida por confirmar por la organizaci\u00F3n.`}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-carbon px-4 py-3 text-center"
              >
                <p className="font-display text-3xl text-epic-orange sm:text-4xl">{item.value}</p>
                <p className="text-xs uppercase tracking-wider text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
