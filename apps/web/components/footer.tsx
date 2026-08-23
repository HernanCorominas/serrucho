import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { Heart, ShieldCheck } from "lucide-react";


export function Footer() {
  return (
    <footer className="w-full border-t border-border/70 bg-card/60 backdrop-blur-xs py-10 text-xs text-muted-foreground no-print mt-auto">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border/60">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1.5">
            <BrandLogo size="sm" showTagline={true} href="/" />
            <p className="text-xs text-muted-foreground max-w-md pt-1">
              {BRAND_CONFIG.subtitle}. Diseñado para coros, viajes, villas, salidas y parrilladas en República Dominicana.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-foreground/80">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Mis Serruchos
            </Link>
            <Link href="/calculadora" className="hover:text-primary transition-colors">
              Calculadora de Cuenta
            </Link>
            <Link href="/dashboard?new=true" className="hover:text-primary transition-colors">
              Crear Serrucho
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground text-center sm:text-left">
          <div className="flex items-center gap-1.5 justify-center">
            <span>Hecho con</span>
            <Heart className="h-3.5 w-3.5 text-orange-500 fill-orange-500 inline" />
            <span>en República Dominicana 🇩🇴</span>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Cero coma flotante · Centavos Exactos</span>
            </span>
            <span>·</span>
            <span>{BRAND_CONFIG.name} © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
