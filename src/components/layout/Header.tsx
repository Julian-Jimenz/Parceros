"use client";

import { INSCRIPTION_SECTION_HREF } from "@/lib/navigation/inscriptionLinks";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const nav = [
  { href: "#inicio", label: "Inicio" },
  { href: "#evento", label: "Evento" },
  { href: "#categorias", label: "Categorias" },
  { href: "#jersey", label: "Jersey" },
  { href: "#condiciones", label: "Condiciones" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-carbon/90 backdrop-blur-md">
      <div className="section-shell flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="#inicio" className="focus-ring flex items-center gap-3 rounded-lg">
          <Image
            src="/images/brand/logo-parceros.jpeg"
            alt="Parceros"
            width={48}
            height={48}
            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
            priority
          />
          <span className="hidden font-display text-lg tracking-wide text-white sm:inline sm:text-xl">
            EPIC RACE
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded text-sm font-medium text-muted transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href={INSCRIPTION_SECTION_HREF}
          className="focus-ring hidden min-h-11 items-center rounded-full bg-epic-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-epic-orange-light md:inline-flex"
        >
          Inscribete
        </Link>
        <button
          type="button"
          className="focus-ring inline-flex rounded-lg border border-white/15 p-2 text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <svg width="24" height="24" fill="none" aria-hidden viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-white/10 bg-graphite md:hidden">
          <nav className="section-shell flex flex-col gap-2 py-4" aria-label="Movil">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-lg px-3 py-2 text-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={INSCRIPTION_SECTION_HREF}
              className="focus-ring mt-2 min-h-11 rounded-full bg-epic-orange px-4 py-3 text-center font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Inscribete ahora
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
