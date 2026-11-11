import { CATEGORIES, type CategoryId } from "@/lib/config/event";
import { inscriptionHref } from "@/lib/navigation/inscriptionLinks";
import Link from "next/link";

export function CategoryCards() {
  return (
    <section id="categorias" className="bg-carbon py-20 sm:py-24" aria-labelledby="categorias-title">
      <div className="section-shell">
        <p className="section-kicker">Categorias</p>
        <h2 id="categorias-title" className="section-title mt-3">
          ENCUENTRA TU CATEGORIA
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <article
              key={cat.id}
              className="card-surface group flex flex-col justify-between p-6 transition hover:border-epic-orange/40"
            >
              <div>
                <h3 className="font-display text-3xl text-white">{cat.title}</h3>
                <p className="mt-3 text-sm text-muted">{cat.description}</p>
              </div>
              <Link
                href={inscriptionHref({ categoria: cat.id })}
                className="focus-ring mt-6 inline-flex w-full items-center justify-center rounded-full border border-epic-orange/50 px-4 py-3 text-sm font-semibold text-epic-orange-light transition group-hover:bg-epic-orange group-hover:text-white sm:w-auto"
              >
                Inscribirme en esta categoria
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.title ?? id;
}
