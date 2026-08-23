"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useRecentSerruchos } from "@/lib/hooks/use-recent-serruchos";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface DeleteSerruchoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoId: string;
  serruchoName: string;
}

export function DeleteSerruchoDialog({
  open,
  onOpenChange,
  serruchoId,
  serruchoName,
}: DeleteSerruchoDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { removeRecent } = useRecentSerruchos();

  const [confirmName, setConfirmName] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isConfirmed = confirmName.trim().toLowerCase() === serruchoName.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;

    try {
      hapticLight();
      setIsDeleting(true);

      const res = await fetch(`/api/serruchos/${serruchoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al eliminar el Serrucho");
      }

      // Clean local storage
      try {
        localStorage.removeItem(`serrucho_my_id_${serruchoId}`);
        removeRecent(serruchoId);
      } catch {}

      hapticSuccess();
      toast({
        type: "success",
        title: "Serrucho eliminado",
        message: `El serrucho "${serruchoName}" y todos sus datos fueron eliminados de forma permanente.`,
      });

      onOpenChange(false);
      router.push("/dashboard");
    } catch (err: any) {
      toast({
        type: "error",
        title: "No se pudo eliminar",
        message: err.message || "Ocurrió un error al intentar eliminar el serrucho.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Eliminar Serrucho Permanentemente
            </DialogTitle>
            <DialogDescription>
              Esta acción es irreversible y destruirá todos los registros asociados.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2 text-xs">
        {/* Warning Alert Box */}
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 space-y-2">
          <div className="font-extrabold flex items-center gap-1.5">
            <span>⚠️ Consecuencias de la eliminación:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800/90 dark:text-red-300/90 pl-1">
            <li>Se borrarán todos los gastos, comprobantes, pagos y transferencias.</li>
            <li>Todos los enlaces compartidos y enlaces de solo lectura quedarán invalidados de inmediato.</li>
            <li>Los estados de cuenta y recibos públicos dejarán de estar disponibles.</li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Para confirmar, escribe el nombre del serrucho:{" "}
            <span className="text-foreground font-black font-mono">"{serruchoName}"</span>
          </label>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={serruchoName}
            className="border-red-300 dark:border-red-900 focus-visible:ring-red-500 text-xs"
            autoFocus
          />
        </div>
      </div>

      <DialogFooter className="sm:justify-between flex-row items-center gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isDeleting}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          onClick={handleDelete}
          disabled={!isConfirmed || isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-md shadow-red-600/20 disabled:opacity-50"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Eliminando...</span>
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              <span>Eliminar Definitivamente</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
