"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicReceiptCard } from "@/features/settlements/components/public-receipt-card";
import { PublicSettlementReceipt } from "@/lib/types/domain";

export default function PublicSettlementPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = React.useState(true);
  const [receipt, setReceipt] = React.useState<PublicSettlementReceipt | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReceipt = React.useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/public/settlement/${token}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Estado de cuenta no encontrado");
      }
      const data = await res.json();
      setReceipt(data);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el estado de cuenta");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  if (loading) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-20 space-y-4">
        <div className="h-48 rounded-3xl bg-muted/60 animate-pulse" />
        <div className="h-64 rounded-3xl bg-muted/60 animate-pulse" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="container max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-600 mx-auto flex items-center justify-center font-bold">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Enlace no válido o expirado</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {error || "No pudimos encontrar el estado de cuenta asociado a este enlace. Verifica el link que te compartió el organizador."}
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="outline" className="gap-2 font-bold text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ir a Serrucho App</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 py-8">
      <PublicReceiptCard receipt={receipt} />
    </div>
  );
}
