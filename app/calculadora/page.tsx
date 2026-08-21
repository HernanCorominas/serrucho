import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { QuickSplitCalculator } from "@/features/calculator/components/quick-split-calculator";

export const metadata: Metadata = {
  title: "Calculadora de Cuenta Dominicana (ITBIS + Ley) | Serrucho",
  description:
    "Divide la cuenta de restaurante al instante incluyendo 18% ITBIS y 10% Propina de Ley. Rápido, exacto y gratis.",
};

export default function CalculadoraPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Calculadora de Cuenta Dominicana 🇩🇴
            </h1>
            <p className="text-sm text-muted-foreground">
              Calcula los impuestos locales (18% ITBIS + 10% Propina Legal) y divide la cuenta de forma exacta entre tus amigos en segundos.
            </p>
          </div>

          <QuickSplitCalculator />
        </div>
      </main>

      <Footer />
    </div>
  );
}
