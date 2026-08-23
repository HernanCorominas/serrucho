"use client";

import * as React from "react";
import { User, LogIn, LogOut, Check, RefreshCw, Smartphone, CreditCard, Mail, Phone, Sparkles } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "auth" | "profile";
}

export function AuthModal({ open, onOpenChange, defaultTab = "auth" }: AuthModalProps) {
  const { user, profile, signIn, signUp, signOut, updateProfile, linkDeviceSessions } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = React.useState<"signin" | "signup">(user ? "signin" : "signup");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [paymentInstructions, setPaymentInstructions] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Sync state when profile loads
  React.useEffect(() => {
    if (profile) {
      setEmail(profile.email || "");
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setPaymentInstructions(profile.default_payment_instructions || "");
    } else {
      setEmail("");
      setName("");
      setPhone("");
      setPaymentInstructions("");
    }
  }, [profile, open]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      hapticLight();
      setIsSubmitting(true);

      if (mode === "signup") {
        if (!name.trim()) {
          toast({ type: "error", title: "Nombre requerido", message: "Por favor ingresa tu nombre para continuar." });
          return;
        }
        await signUp(email, name, phone);
        toast({
          type: "success",
          title: "¡Cuenta creada con éxito!",
          message: `Bienvenido a Serrucho, ${name.trim()}. Tus serruchos se han sincronizado.`,
        });
      } else {
        await signIn(email, name || undefined);
        toast({
          type: "success",
          title: "¡Sesión iniciada!",
          message: "Acceso recuperado y sincronizado en este dispositivo.",
        });
      }

      hapticSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error de autenticación",
        message: err.message || "No se pudo completar la operación.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      hapticLight();
      setIsSubmitting(true);

      await updateProfile({
        full_name: name.trim(),
        phone: phone.trim() || null,
        default_payment_instructions: paymentInstructions.trim() || null,
      });

      hapticSuccess();
      toast({
        type: "success",
        title: "Perfil actualizado",
        message: "Tus datos e instrucciones de pago se guardaron correctamente.",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error",
        message: err.message || "No se pudo actualizar el perfil.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncDevice = async () => {
    try {
      hapticLight();
      setIsSyncing(true);
      const res = await linkDeviceSessions();
      hapticSuccess();
      toast({
        type: "success",
        title: "Sincronización completa",
        message: `Se vincularon ${res.linkedSerruchos} serrucho(s) y ${res.linkedParticipants} participante(s) a tu cuenta.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error al sincronizar",
        message: err.message || "No se pudieron sincronizar los serruchos locales.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {user ? (
        // ─── LOGGED IN: PROFILE & MULTI-DEVICE MANAGEMENT ──────────────────────────────
        <form onSubmit={handleProfileSave}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-base uppercase">
                {user.name.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle>Mi Cuenta & Perfil</DialogTitle>
                  <Badge variant="success" className="text-[10px] font-extrabold gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    Sincronizado
                  </Badge>
                </div>
                <DialogDescription className="text-xs">{user.email}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Multi-device sync card */}
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-4 w-4 text-primary shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-foreground">Sincronización Multi-Dispositivo</div>
                  <div className="text-muted-foreground text-[11px]">
                    Vincula los serruchos creados en este navegador a tu cuenta en la nube.
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncDevice}
                disabled={isSyncing}
                className="h-8 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sincronizar</span>
              </Button>
            </div>

            {/* Profile Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Nombre para mostrar
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Teléfono / WhatsApp 🇩🇴
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="809-555-0123"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Instrucciones de Pago por Defecto 🇩🇴
                </label>
                <textarea
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="Ej: Banco Popular Ahorros: 789456123 / BHD / Banreservas / Qik a mi cédula..."
                  className="w-full min-h-[75px] text-xs rounded-xl border border-input bg-background p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed"
                />
                <p className="text-[10px] text-muted-foreground">
                  Estas instrucciones se autocompletarán cuando crees un nuevo Serrucho para cobrar a tus amigos.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex-row items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                toast({
                  type: "info",
                  title: "Sesión cerrada",
                  message: "Has vuelto al modo invitado anónimo.",
                });
                onOpenChange(false);
              }}

              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Guardar Cambios</span>
            </Button>
          </DialogFooter>
        </form>
      ) : (
        // ─── GUEST: SIGN IN / REGISTER FORM ───────────────────────────────────────────
        <form onSubmit={handleAuthSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-primary font-bold text-xl">
                🪚
              </div>
              <div>
                <DialogTitle>
                  {mode === "signup" ? "Crear Cuenta en Serrucho" : "Iniciar Sesión"}
                </DialogTitle>
                <DialogDescription>
                  {mode === "signup"
                    ? "Sincroniza tus serruchos entre tu celular y computadora sin costo."
                    : "Ingresa tu email para recuperar y sincronizar tus serruchos."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === "signup"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Crear Cuenta (Gratis)
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === "signin"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ya tengo cuenta
              </button>
            </div>

            {/* Value proposition highlight */}
            <div className="rounded-xl p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200 dark:border-orange-900/40 text-xs text-foreground flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>
                {mode === "signup"
                  ? "Tus serruchos e historial quedarán protegidos si cambias de celular o borras tu caché."
                  : "Se vincularán automáticamente todos los serruchos visitados en este dispositivo."}
              </span>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              {mode === "signup" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Nombre Completo
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre y apellido"
                      required={mode === "signup"}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Teléfono / WhatsApp (Opcional)
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="809-555-0123"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex-row items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Seguir como invitado
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-md shadow-primary/20"
            >
              <LogIn className="h-4 w-4" />
              <span>{mode === "signup" ? "Registrarme & Sincronizar" : "Entrar a mi Cuenta"}</span>
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}
