import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manizales Epic Race 2026 | Inscripcion gratuita",
  description:
    "Manizales Epic Race 2026 - 13 de diciembre de 2026 en Manizales, Caldas. Vive el desafio. Inscripcion gratuita.",
  openGraph: {
    title: "Manizales Epic Race 2026",
    description: "Vive el desafio. Supera tus limites. Inscripcion gratuita.",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bebas.variable} ${inter.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
