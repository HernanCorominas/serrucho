"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  PieChart,
  MessageCircle,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateSerruchoDialog } from "@/features/serruchos/components/create-serrucho-dialog";
import { QuickSplitCalculator } from "@/features/calculator/components/quick-split-calculator";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_CONFIG } from "@/lib/brand-config";

export default function HomePage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/60 bg-gradient-to-b from-orange-500/5 via-background to-background">
        <div className="container px-4 sm:px-6 relative z-10 max-w-5xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-5 py-1.5 px-4 rounded-full border-orange-300/80 bg-orange-50/90 text-orange-950 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300 font-extrabold text-xs inline-flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />
            <span>Reparto de Gastos para el Coro Dominicano 🇩🇴</span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
            Divide los gastos del coro{" "}
            <span className={`bg-gradient-to-r ${BRAND_CONFIG.logo.textGradient} bg-clip-text text-transparent`}>
              sin enredos ni estrés.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            La forma más rápida de anotar quién pagó la villa, las compras, las frías o la gasolina. Optimiza con <strong>Menos Transferencias</strong>, cobra por <strong>WhatsApp en 1 toque</strong> y salda cuentas en paz.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto sm:max-w-none">
            <Button
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="w-full sm:w-auto text-base font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-orange-500/25 h-13 px-8 rounded-2xl gap-2 transition-all transform hover:scale-[1.02]"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Crear un Serrucho Gratis</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base font-extrabold h-13 px-8 rounded-2xl border-border hover:bg-muted/80 gap-2"
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span>Mis Serruchos</span>
              </Button>
            </Link>
          </div>

          {/* Value Highlights Cards */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 mb-2">
                <Zap className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">Menos Transferencias</div>
              <div className="text-xs text-muted-foreground mt-0.5">Algoritmo inteligente que reduce deudas cruzadas</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-2">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">Cobro por WhatsApp</div>
              <div className="text-xs text-muted-foreground mt-0.5">Mensaje cordial con link y monto personalizado</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-2">
                <PieChart className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">Moneda RD$ y Cuotas</div>
              <div className="text-xs text-muted-foreground mt-0.5">Cálculos exactos en centavos para parejas y grupos</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-2">
                <Lock className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">Cierre Inmutable</div>
              <div className="text-xs text-muted-foreground mt-0.5">Cuentas transparentes y congeladas sin alteración</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (Kittysplit 3-Step Experience) */}
      <section className="py-16 md:py-20 border-b border-border/60 bg-background">
        <div className="container px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary">
              Simple & Transparente
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              ¿Cómo funciona Serrucho?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Solo 3 pasos sencillos para mantener las cuentas claras entre amigos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs relative overflow-hidden space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-primary font-black text-xl">
                1
              </div>
              <h3 className="font-black text-lg text-foreground">Arma el grupo</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Crea tu serrucho en 10 segundos y añade a tus amigos con su nombre y teléfono dominicano.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs relative overflow-hidden space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-xl">
                2
              </div>
              <h3 className="font-black text-lg text-foreground">Anota los gastos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Registra quién pagó qué y cómo se divide (partes iguales, montos fijos o cuotas familiares).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs relative overflow-hidden space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 font-black text-xl">
                3
              </div>
              <h3 className="font-black text-lg text-foreground">Saldar cuentas</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                El sistema simplifica las deudas. Comparte por WhatsApp los datos de transferencia y listo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Calculator Showcase */}
      <section className="py-16 bg-muted/20 border-b border-border/60">
        <div className="container px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1.5">
            <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary">
              Herramienta Rápida
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              ¿Saliste a cenar? Prueba la Calculadora de Cuenta
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Calcula 18% ITBIS + 10% Ley y copia el desglose a tu grupo de WhatsApp en segundos.
            </p>
          </div>

          <QuickSplitCalculator />
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 md:py-20 text-center bg-gradient-to-t from-orange-500/10 via-background to-background">
        <div className="container px-4 max-w-2xl mx-auto space-y-5">
          <BrandLogo size="lg" showTagline={false} href={null} className="justify-center" />
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            ¿Listo para organizar tu próximo coro?
          </h2>
          <p className="text-sm text-muted-foreground">
            Crea tu grupo sin registrarte o inicia sesión para sincronizar todos tus dispositivos.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white font-extrabold px-8 h-13 rounded-2xl shadow-lg shadow-orange-500/25 gap-2"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Crear Serrucho Ahora</span>
            </Button>
          </div>
        </div>
      </section>

      <CreateSerruchoDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
