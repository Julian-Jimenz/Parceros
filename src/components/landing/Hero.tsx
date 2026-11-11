import { EVENT } from "@/lib/config/event";
import { inscriptionHref } from "@/lib/navigation/inscriptionLinks";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate min-h-[85vh] overflow-hidden bg-carbon"
      aria-labelledby="hero-title"
    >
      <Image
        src="/images/hero/hero-event.jpeg"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-40"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/85 to-carbon/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-carbon via-transparent to-carbon/60" />

      <div className="section-shell relative flex min-h-[85vh] flex-col justify-center py-16">
        <p className="section-kicker">{EVENT.registrationFreeLabel}</p>
        <h1
          id="hero-title"
          className="mt-4 max-w-4xl font-display text-4xl leading-none text-white sm:text-6xl lg:text-8xl"
        >
          {EVENT.name}
        </h1>
        <p className="mt-4 text-base font-semibold text-epic-orange-light sm:text-xl">
          {`${EVENT.dateLabel} | ${EVENT.location}`}
        </p>
        <p className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">{EVENT.tagline}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={inscriptionHref()}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-epic-orange px-8 py-4 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-epic-orange-light"
          >
            {`Inscr\u00EDbete ahora`}
          </Link>
          <Link
            href="#categorias"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-4 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:border-epic-orange/60"
          >
            {`Conoce las categor\u00EDas`}
          </Link>
        </div>
      </div>
    </section>
  );
}
