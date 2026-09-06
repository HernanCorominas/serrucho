"use client";

import * as React from "react";
import Link from "next/link";
import {
  LogIn,
  LogOut,
  LayoutDashboard,
  UserCheck,
  ChevronDown,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { AuthModal } from "@/features/auth/components/auth-modal";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

export function UserNavMenu() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authModalTab, setAuthModalTab] = React.useState<"auth" | "profile">("auth");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenAuth = (tab: "auth" | "profile" = "auth") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      hapticLight();
      await signOut();
      setMenuOpen(false);
      hapticSuccess();
      toast({
        type: "info",
        title: "Sesión cerrada",
        message: "Has cerrado sesión correctamente. Puedes seguir usando Serrucho como invitado.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error al cerrar sesión",
        message: err.message || "Ocurrió un error.",
      });
    }
  };

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenAuth("auth")}
            className="gap-1.5 font-bold text-xs sm:text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 rounded-xl"
          >
            <LogIn className="h-4 w-4 text-primary" />
            <span>Iniciar Sesión</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenAuth("auth")}
            className="hidden sm:inline-flex gap-1.5 font-extrabold text-xs sm:text-sm bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded-xl shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Crear Cuenta</span>
          </Button>
        </div>

        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          defaultTab={authModalTab}
        />
      </>
    );
  }

  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl border border-border/80 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer select-none"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-xs shadow-xs">
            {initial}
          </div>
          <div className="text-left hidden md:block">
            <span className="font-extrabold text-xs block text-foreground leading-tight max-w-[110px] truncate">
              {user.name}
            </span>
            <span className="text-[10px] text-muted-foreground block leading-tight font-medium">
              Conectado
            </span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180 text-primary" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border/80 shadow-xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
            {/* Header info */}
            <div className="px-3 py-2.5 border-b border-border/60 mb-1">
              <div className="font-extrabold text-sm text-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              {profile?.default_payment_instructions && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  <CreditCard className="h-3 w-3" />
                  <span className="truncate">Cuenta Bancaria configurada</span>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="space-y-0.5">
              <button
                onClick={() => handleOpenAuth("profile")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-foreground hover:bg-muted rounded-xl transition-colors text-left"
              >
                <UserCheck className="h-4 w-4 text-primary" />
                <span>Mi Perfil & Datos de Pago</span>
              </button>

              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span>Mis Serruchos</span>
              </Link>
            </div>

            {/* Logout button */}
            <div className="pt-1.5 mt-1.5 border-t border-border/60">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión (Log Out)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
      />
    </>
  );
}
