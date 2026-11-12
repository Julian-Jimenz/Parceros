import { EVENT } from "@/lib/config/event";
import { INSCRIPTION_SECTION_HREF } from "@/lib/navigation/inscriptionLinks";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-graphite py-12">
      <div className="section-shell grid gap-10 md:grid-cols-3">
        <div className="flex items-center gap-3">
          <Image
            src="/images/brand/logo-parceros.jpeg"
            alt="Logo Parceros"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <div>
            <p className="font-display text-2xl text-white">{EVENT.name}</p>
            <p className="text-sm text-muted">{EVENT.dateLabel}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Enlaces</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="#evento" className="focus-ring hover:text-white">
                Sobre el evento
              </Link>
            </li>
            <li>
              <Link href={INSCRIPTION_SECTION_HREF} className="focus-ring hover:text-white">
                {`Inscripci\u00F3n`}
              </Link>
            </li>
            <li>
              <Link href="#condiciones" className="focus-ring hover:text-white">
                Condiciones
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Aliados</p>
          <a
            href="/images/brand/logo-fundacion.pdf"
            className="focus-ring mt-3 inline-block text-sm text-epic-orange-light hover:text-epic-orange"
          >
            {`Logo fundaci\u00F3n (PDF)`}
          </a>
          <p className="mt-6 text-xs text-muted">Fase 2. Sin inscripciones reales.</p>
        </div>
      </div>
    </footer>
  );
}
