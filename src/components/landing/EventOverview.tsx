const pillars = [
  {
    title: "Competencia y desafio",
    text: "Una experiencia para quienes buscan superar sus limites en la montana.",
  },
  {
    title: "Experiencia deportiva",
    text: "Organizacion profesional enfocada en seguridad, logistica y disfrute.",
  },
  {
    title: "Comunidad ciclista",
    text: "Conecta con ciclistas que comparten pasion por el MTB y el ciclismo de ruta.",
  },
  {
    title: "Espiritu de aventura",
    text: "Manizales como escenario. Detalles oficiales por confirmar.",
  },
];

export function EventOverview() {
  return (
    <section id="evento" className="bg-graphite py-20 sm:py-24" aria-labelledby="evento-title">
      <div className="section-shell">
        <p className="section-kicker">Sobre el evento</p>
        <h2 id="evento-title" className="section-title mt-3">
          LA MONTANA TE ESPERA
        </h2>
        <p className="mt-6 max-w-3xl text-lg text-muted">
          Manizales Epic Race reunira a la comunidad ciclista. Distancias, horarios, premios y
          recorrido se publicaran cuando la organizacion los confirme.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {pillars.map((item) => (
            <article key={item.title} className="card-surface p-6">
              <h3 className="font-display text-2xl text-epic-orange-light">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
