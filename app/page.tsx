"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Send,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateSerruchoDialog } from "@/features/serruchos/components/create-serrucho-dialog";

export default function HomePage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/60 bg-gradient-to-b from-orange-500/5 via-background to-background">
        <div className="container px-4 sm:px-6 relative z-10 max-w-5xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-4 py-1.5 px-4 rounded-full border-orange-300 bg-orange-50/80 text-orange-900 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />
            <span>La app dominicana para dividir gastos en coro</span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Haz el <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">serrucho</span> sin cálculos raros ni enredos.
          </h1>

          <p className="mt-5 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Anota quién pagó la villa, las compras o la gasolina. Divide equitativamente o por porcentaje, congela la cuenta y envía el estado de cuenta a cada persona.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="w-full sm:w-auto text-base font-extrabold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-orange-500/25 h-13 px-8 rounded-2xl gap-2"
            >
              <span>Crear un Serrucho Gratis</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base font-bold h-13 px-8 rounded-2xl"
              >
                Ver Demo Las Terrenas 🌴
              </Button>
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
              <Zap className="h-5 w-5 text-orange-500 mb-1" />
              <div className="font-bold text-sm text-foreground">En 2 Minutos</div>
              <div className="text-xs text-muted-foreground">Listo para usar sin crear cuenta</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
              <PieChart className="h-5 w-5 text-emerald-600 mb-1" />
              <div className="font-bold text-sm text-foreground">Reparto Flexible</div>
              <div className="text-xs text-muted-foreground">Parejo o porcentajes por persona</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
              <Lock className="h-5 w-5 text-amber-600 mb-1" />
              <div className="font-bold text-sm text-foreground">Cierre Inmutable</div>
              <div className="text-xs text-muted-foreground">Cuentas congeladas sin alteración</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
              <Send className="h-5 w-5 text-blue-600 mb-1" />
              <div className="font-bold text-sm text-foreground">Links Seguros</div>
              <div className="text-xs text-muted-foreground">Resend Email y WhatsApp ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/20 border-b border-border/60">
        <div className="container px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              ¿Cómo funciona Serrucho?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Flujo transparente diseñado para el coro dominicano
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-primary font-black text-lg">
                1
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Arma el grupo</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Crea el serrucho y añade a los participantes con su nombre, correo y número de teléfono.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-black text-lg">
                2
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Anota los gastos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Registra quién pagó qué y cómo se divide (entre todos o solo entre quienes consumieron).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-black text-lg">
                3
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Cierra y cobra</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Pulsa "Cerrar serrucho", pon tus cuentas bancarias y cada participante recibe su estado individual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 text-center">
        <div className="container px-4 max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            ¿Listo para tu próximo serrucho?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Crea tu grupo ahora mismo y olvídate de discusiones sobre quién pagó de más.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-white font-bold px-8 rounded-2xl shadow-md"
            >
              Comenzar Ahora ➔
            </Button>
          </div>
        </div>
      </section>

      <CreateSerruchoDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
