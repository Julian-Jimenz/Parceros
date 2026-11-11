import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Countdown } from "@/components/landing/Countdown";
import { EventOverview } from "@/components/landing/EventOverview";
import { CategoryCards } from "@/components/landing/CategoryCards";
import { JerseyShowcase } from "@/components/landing/JerseyShowcase";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { EventConditions } from "@/components/landing/EventConditions";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Countdown />
        <EventOverview />
        <CategoryCards />
        <JerseyShowcase />
        <Suspense
          fallback={
            <div className="section-shell py-20 text-muted">Cargando formulario...</div>
          }
        >
          <RegistrationWizard />
        </Suspense>
        <EventConditions />
      </main>
      <Footer />
    </>
  );
}
