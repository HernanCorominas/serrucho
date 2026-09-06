"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  PieChart,
  MessageCircle,
  LayoutDashboard,
  PlusCircle,
  Link as LinkIcon,
  LogIn,
  Users,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { hapticSuccess, hapticImpact, hapticLight } from "@/lib/utils/haptics";

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Instant inline creation state (Kittysplit style)
  const [groupName, setGroupName] = React.useState("");
  const [creatorName, setCreatorName] = React.useState("");
  const [membersInput, setMembersInput] = React.useState("");
  const [currency, setCurrency] = React.useState<"DOP" | "USD" | "EUR">("DOP");
  const [isCreating, setIsCreating] = React.useState(false);

  // Join link/code state
  const [inviteUrlOrToken, setInviteUrlOrToken] = React.useState("");

  const handleInstantCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast({ type: "error", message: "Escribe el nombre de tu serrucho o evento" });
      return;
    }

    if (!creatorName.trim()) {
      toast({ type: "error", message: "¿Quién eres tú? Ingresa tu nombre" });
      return;
    }

    // Parse members (comma or newline separated)
    const rawMembers = membersInput
      .split(/[\n,]+/)
      .map((m) => m.trim())
      .filter((m) => m.length > 0 && m.toLowerCase() !== creatorName.trim().toLowerCase());

    const uniqueMembers = Array.from(new Set(rawMembers));

    try {
      setIsCreating(true);
      hapticLight();

      const payload = {
        name: groupName.trim(),
        description: null,
        currency,
        creator_name: creatorName.trim(),
        creator_email: `${creatorName.trim().toLowerCase().replace(/\s+/g, "")}@serrucho.local`,
        initial_participants: uniqueMembers.length > 0 ? uniqueMembers : ["Amigo 1", "Amigo 2"],
        event_date: new Date().toISOString().split("T")[0],
      };

      const res = await fetch("/api/serruchos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo crear el serrucho");
      }

      const created = await res.json();
      hapticSuccess();
      toast({
        type: "success",
        title: "¡Serrucho creado con éxito! 🌴",
        message: `Abriendo "${created.name}"...`,
      });

      // Redirect directly to the newly created serrucho workspace
      router.push(`/dashboard/${created.id}`);
    } catch (err: any) {
      hapticImpact();
      toast({
        type: "error",
        message: err.message || "Error al crear el serrucho",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inviteUrlOrToken.trim();
    if (!raw) {
      toast({
        type: "error",
        message: "Pega el enlace o código de invitación de tu serrucho",
      });
      return;
    }

    hapticLight();
    let token = raw;
    try {
      if (raw.includes("/")) {
        const parts = raw.split("/").filter(Boolean);
        token = parts[parts.length - 1];
      }
    } catch {
      token = raw;
    }

    router.push(`/join/${encodeURIComponent(token)}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Kittysplit Top Hero Header with Soft Teal Background */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border/60 bg-gradient-to-b from-teal-500/10 via-background to-background">
        <div className="container px-4 sm:px-6 relative z-10 max-w-5xl mx-auto text-center">
          
          <Badge
            variant="outline"
            className="mb-5 py-1.5 px-4 rounded-full border-teal-500/30 bg-teal-50/90 text-teal-950 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300 font-extrabold text-xs inline-flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Reparto Inteligente de Gastos en Grupo 🇩🇴</span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
            La forma más fácil de compartir gastos con amigos,{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              sin enredos ni contraseñas.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Anota quién pagó la villa, las compras, la cena o el combustible. Serrucho calcula quién debe a quién con la <strong>menor cantidad de transferencias</strong> y te permite cobrar por <strong>WhatsApp en 1 toque</strong>.
          </p>

          {/* Instant Inline Create Card (Kittysplit Style) */}
          <div className="mt-10 max-w-xl mx-auto text-left">
            <Card className="border-2 border-teal-500/30 bg-card shadow-xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪚</span>
                    <h2 className="text-lg font-black tracking-tight">Crear un Serrucho Gratis</h2>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                    100% Gratis
                  </span>
                </div>
                <p className="text-xs text-teal-50 mt-1">
                  Sin registro obligatorio. Comparte el enlace con tus amigos y empiecen al instante.
                </p>
              </div>

              <CardContent className="p-6 space-y-4">
                <form onSubmit={handleInstantCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="group_name" className="text-xs sm:text-sm font-extrabold text-foreground">
                      1. ¿Cómo se llama el serrucho o viaje? *
                    </Label>
                    <Input
                      id="group_name"
                      placeholder="Ej. Fin de semana en Las Terrenas 🌴, Cena de Navidad, Coro Villa"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="h-11 rounded-xl font-medium text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="creator_name" className="text-xs sm:text-sm font-extrabold text-foreground">
                        2. ¿Quién eres tú? (Tu nombre) *
                      </Label>
                      <Input
                        id="creator_name"
                        placeholder="Ej. Braulio, Carlos, María"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        className="h-11 rounded-xl font-medium text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="currency_select" className="text-xs sm:text-sm font-extrabold text-foreground">
                        Moneda principal
                      </Label>
                      <select
                        id="currency_select"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as "DOP" | "USD" | "EUR")}
                        className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="DOP">🇩🇴 DOP (RD$ Peso Dominicano)</option>
                        <option value="USD">🇺🇸 USD ($ Dólar)</option>
                        <option value="EUR">🇪🇺 EUR (€ Euro)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="members_input" className="text-xs sm:text-sm font-extrabold text-foreground">
                      3. ¿Quiénes más participan? (Nombres separados por coma)
                    </Label>
                    <Input
                      id="members_input"
                      placeholder="Ej. Hernan, Laura, Carlos, David"
                      value={membersInput}
                      onChange={(e) => setMembersInput(e.target.value)}
                      className="h-11 rounded-xl font-medium text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Puedes agregar más amigos o eliminarlos en cualquier momento dentro del serrucho.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isCreating}
                    className="w-full h-12 text-base font-black bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-lg shadow-teal-600/25 gap-2 transition-all transform hover:scale-[1.01]"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>{isCreating ? "Creando Serrucho..." : "Crear Serrucho Ahora ➔"}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Join with invitation link/code */}
          <div className="mt-8 max-w-xl mx-auto">
            <Card className="border-border bg-card/80 backdrop-blur-xs shadow-sm rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <form onSubmit={handleOpenInvite} className="space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                    <LinkIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>¿Te invitaron a un serrucho? Pega el enlace aquí:</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Ej. https://serrucho.do/k/... o código del serrucho"
                      value={inviteUrlOrToken}
                      onChange={(e) => setInviteUrlOrToken(e.target.value)}
                      className="text-xs sm:text-sm h-10 rounded-xl"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      className="font-bold text-xs sm:text-sm h-10 px-5 rounded-xl shrink-0 gap-1.5 bg-muted hover:bg-muted/80 text-foreground"
                    >
                      <LogIn className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span>Entrar</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Value Highlights Cards */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-2">
                <Zap className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">Menos Transferencias</div>
              <div className="text-xs text-muted-foreground mt-0.5">Algoritmo que simplifica y reduce deudas cruzadas</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">Cobro por WhatsApp</div>
              <div className="text-xs text-muted-foreground mt-0.5">Mensaje cordial con link y monto exacto en RD$</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-2">
                <PieChart className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">3 Métodos de Reparto</div>
              <div className="text-xs text-muted-foreground mt-0.5">Equitativo, por cuotas (shares) o montos exactos</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
                <Lock className="h-5 w-5" />
              </div>
              <div className="font-extrabold text-sm text-foreground">Sin Contraseñas</div>
              <div className="text-xs text-muted-foreground mt-0.5">Participa al instante identificándote con tu nombre</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (3-Step Experience) */}
      <section className="py-16 md:py-20 border-b border-border/60 bg-background">
        <div className="container px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <Badge variant="outline" className="text-xs font-bold border-teal-500/30 text-teal-600 dark:text-teal-400">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-black text-xl">
                1
              </div>
              <h3 className="font-black text-lg text-foreground">Crea tu Serrucho</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Ponle nombre al grupo y agrega a tus amigos. Obtén un enlace único para compartir por WhatsApp.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs relative overflow-hidden space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xl">
                2
              </div>
              <h3 className="font-black text-lg text-foreground">Anota los Gastos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Registra quién pagó qué y cómo se divide (partes iguales, cuotas, montos exactos o porcentajes).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs relative overflow-hidden space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-black text-xl">
                3
              </div>
              <h3 className="font-black text-lg text-foreground">Saldar Cuentas</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                El sistema simplifica las deudas. Comparte por WhatsApp los datos de transferencia bancaria y marca como pagado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="py-12 border-t border-border/60 bg-muted/20 text-center">
        <div className="container px-4 max-w-2xl mx-auto space-y-4">
          <BrandLogo size="md" showTagline={false} href={null} className="justify-center" />
          <p className="text-xs text-muted-foreground">
            Serrucho 🪚 — Reparto inteligente de gastos para República Dominicana. $0 costo y 100% privado.
          </p>
        </div>
      </footer>
    </div>
  );
}

