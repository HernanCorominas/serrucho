"use client";

import * as React from "react";
import {
  PaperclipIcon,
  X,
  ImageIcon,
  FileText,
  Upload,
  Eye,
  RotateCcw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_RECEIPTS_PER_TRANSACTION } from "@/lib/types/domain";
import { ReceiptService } from "@/features/receipts/service";

interface ReceiptGalleryProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  label?: string;
}

export function ReceiptGallery({
  urls,
  onChange,
  disabled = false,
  label = "Comprobantes",
}: ReceiptGalleryProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      if (replaceIndex !== null) {
        const result = await ReceiptService.replaceReceipt(urls, replaceIndex, file);
        if (result.error) {
          setError(result.error);
        } else {
          onChange(result.urls);
        }
        setReplaceIndex(null);
      } else {
        const result = await ReceiptService.addReceipt(urls, file);
        if (result.error) {
          setError(result.error);
        } else {
          onChange(result.urls);
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onChange(ReceiptService.removeReceipt(urls, index));
    setError(null);
  };

  const triggerFileInput = (replacingIndex?: number) => {
    if (replacingIndex !== undefined) setReplaceIndex(replacingIndex);
    else setReplaceIndex(null);
    fileInputRef.current?.click();
  };

  const canAddMore = urls.length < MAX_RECEIPTS_PER_TRANSACTION;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <PaperclipIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
          <span className="text-muted-foreground font-normal">
            ({urls.length}/{MAX_RECEIPTS_PER_TRANSACTION})
          </span>
        </label>
        {!disabled && canAddMore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => triggerFileInput()}
            disabled={uploading}
            className="gap-1 text-xs h-7 px-2 font-semibold text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{uploading ? "Subiendo..." : "Adjuntar"}</span>
          </Button>
        )}
      </div>

      {/* Gallery Grid */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => {
            const thumb = ReceiptService.getThumbnailUrl(url);
            return (
              <div
                key={i}
                className="relative group flex-shrink-0 h-20 w-20 rounded-xl border border-border overflow-hidden bg-muted shadow-xs"
              >
                {thumb.type === "image" ? (
                  <img
                    src={url}
                    alt={ReceiptService.getReceiptLabel(i)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground gap-1">
                    <FileText className="h-7 w-7 text-primary/70" />
                    <span className="text-[9px] font-semibold">PDF</span>
                  </div>
                )}

                {/* Overlay controls */}
                {!disabled && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    {thumb.type === "image" && (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
                        title="Ver comprobante"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => triggerFileInput(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
                      title="Reemplazar comprobante"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/80 text-white hover:bg-red-700"
                      title="Eliminar comprobante"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Index badge */}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] bg-black/60 text-white rounded-sm px-1">
                    {i + 1}/{MAX_RECEIPTS_PER_TRANSACTION}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add more slot */}
          {!disabled && canAddMore && (
            <button
              type="button"
              onClick={() => triggerFileInput()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex-shrink-0"
            >
              <Upload className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Agregar</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state CTA */}
      {urls.length === 0 && !disabled && (
        <button
          type="button"
          onClick={() => triggerFileInput()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors text-xs font-semibold"
        >
          <ImageIcon className="h-4 w-4" />
          <span>Adjuntar foto o comprobante (opcional)</span>
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading || disabled}
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={lightboxUrl}
              alt="Comprobante"
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
