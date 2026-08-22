import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettlementService } from "@/features/settlements/service";
import { PublicReceiptCard } from "@/features/settlements/components/public-receipt-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const receipt = await SettlementService.getPublicSettlement(token);
  return {
    title: receipt
      ? `Estado de Cuenta (${receipt.participant.name}) | ${receipt.serrucho.name}`
      : "Estado de Cuenta | Serrucho",
    description: "Comprobante y estado de cuenta individual seguro de Serrucho.",
  };
}

export default async function PublicSettlementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const receipt = await SettlementService.getPublicSettlement(token);

  if (!receipt) {
    return (
      <div className="container max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-600 mx-auto flex items-center justify-center font-bold">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Enlace no válido o expirado</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          No pudimos encontrar el estado de cuenta asociado a este enlace. Verifica el link que te compartió el organizador.
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
