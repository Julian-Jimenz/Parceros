import { EVENT } from "@/lib/config/event";
import { inscriptionHref } from "@/lib/navigation/inscriptionLinks";
import Image from "next/image";
import Link from "next/link";

export function JerseyShowcase() {
  return (
    <section id="jersey" className="bg-graphite py-20 sm:py-24" aria-labelledby="jersey-title">
      <div className="section-shell grid items-center gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-carbon">
          <Image
            src="/images/jersey/jersey-mockup-01-ciudad.jpeg"
            alt="Mockup provisional del jersey oficial naranja"
            width={900}
            height={700}
            className="h-auto w-full object-cover"
          />
          <p className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-2 text-center text-xs text-muted">
            Mockup provisional. Pendiente diseno oficial.
          </p>
        </div>
        <div>
          <p className="section-kicker">Jersey oficial</p>
          <h2 id="jersey-title" className="section-title mt-3">
            LLEVA LA EPIC RACE CONTIGO
          </h2>
          <p className="mt-6 text-lg text-white">
            Jersey oficial naranja. Precio:{" "}
            <span className="font-semibold text-epic-orange">{EVENT.jerseyPriceLabel}</span>
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>Manga corta o manga larga</li>
            <li>Corte ruta (ajustado) o corte MTB (amplio)</li>
            <li>Talla segun tabla del proveedor</li>
          </ul>
          <p className="mt-6 rounded-xl border border-epic-orange/30 bg-epic-orange/10 px-4 py-3 text-sm font-medium text-white">
            TU INSCRIPCION ES GRATIS. EL JERSEY ES OPCIONAL.
          </p>
          <Link
            href={inscriptionHref({ jersey: true })}
            className="focus-ring mt-8 inline-flex rounded-full bg-epic-orange px-8 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-epic-orange-light"
          >
            Quiero mi jersey
          </Link>
        </div>
      </div>
    </section>
  );
}
