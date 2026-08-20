import Link from "next/link";
import { PlusCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 no-print">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-md shadow-orange-500/20 text-white font-black text-xl">
            🪚
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              SERRUCHO
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block -mt-1 tracking-wider">
              Reparto Inteligente 🇩🇴
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" aria-label="Mis Serruchos">
            <Button variant="ghost" size="sm" className="gap-2 font-semibold" aria-label="Mis Serruchos">
              <LayoutDashboard className="h-4 w-4" />
              <span className="inline">Mis Serruchos</span>
            </Button>
          </Link>
          <Link href="/dashboard?new=true">
            <Button size="sm" className="gap-1.5 shadow-sm font-bold bg-primary hover:bg-primary/90 text-white">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Serrucho</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
