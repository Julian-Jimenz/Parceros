const items = [
  {
    title: "Inscripcion",
    body: "Proceso gratuito. Cupos limitados internamente. Apertura/cierre desde administracion.",
  },
  {
    title: "Jersey opcional",
    body: "Pago manual Nequi. Comprobante en revision; no confirma pago automaticamente.",
  },
  {
    title: "Informacion del evento",
    body: "Distancias, horarios y recorrido se publicaran cuando la organizacion los confirme.",
  },
  {
    title: "Proteccion de datos",
    body: "Datos de salud sensibles solo con autorizaciones conforme a revision juridica.",
  },
];

export function EventConditions() {
  return (
    <section id="condiciones" className="bg-carbon py-20 sm:py-24" aria-labelledby="condiciones-title">
      <div className="section-shell">
        <p className="section-kicker">Informacion</p>
        <h2 id="condiciones-title" className="section-title mt-3">
          CONDICIONES DEL EVENTO
        </h2>
        <p className="mt-4 max-w-3xl text-muted">
          Resumen general. Textos legales definitivos en el formulario tras aprobacion.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-graphite/60 p-6">
              <h3 className="font-display text-2xl text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
