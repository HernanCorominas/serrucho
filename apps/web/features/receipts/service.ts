/**
 * ReceiptService — Gestión de comprobantes adjuntos.
 * 
 * Estrategia $0-cost: almacena comprobantes como data-URLs en el campo
 * receipt_urls de la transacción (sin Supabase Storage en dev).
 * En producción, esta capa puede ser intercambiada por Supabase Storage / R2.
 */

import {
  MAX_RECEIPTS_PER_TRANSACTION,
  MAX_RECEIPT_FILE_SIZE_BYTES,
  ALLOWED_RECEIPT_MIME_TYPES,
} from "@/lib/types/domain";

export interface ReceiptValidationResult {
  valid: boolean;
  error?: string;
}

export class ReceiptService {
  /**
   * Validates a file before attachment.
   * Checks MIME type, real magic bytes, and size limits.
   */
  static async validate(file: File): Promise<ReceiptValidationResult> {
    // 1. Extension declared MIME
    if (!ALLOWED_RECEIPT_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido (${file.type}). Solo se aceptan imágenes (JPG, PNG, WEBP, HEIC) o PDF.`,
      };
    }

    // 2. Size check
    if (file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `El archivo pesa ${sizeMB}MB. El límite por comprobante es 5MB.`,
      };
    }

    // 3. Real magic bytes check (first 4 bytes)
    try {
      const header = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(header);
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      const isJpeg = hex.startsWith("ffd8ff");
      const isPng = hex.startsWith("89504e47");
      const isWebp = hex.startsWith("52494646"); // RIFF
      const isPdf = hex.startsWith("25504446"); // %PDF
      // HEIC has various headers — allow by MIME without deep check

      const isImage = file.type.startsWith("image/");
      const isPdfType = file.type === "application/pdf";

      if (isPdfType && !isPdf) {
        return { valid: false, error: "El archivo no parece ser un PDF válido." };
      }

      if (file.type === "image/jpeg" && !isJpeg) {
        return { valid: false, error: "El archivo no parece ser una imagen JPEG válida." };
      }

      if (file.type === "image/png" && !isPng) {
        return { valid: false, error: "El archivo no parece ser una imagen PNG válida." };
      }

      // WebP: RIFF....WEBP
      if (file.type === "image/webp" && !isWebp) {
        return { valid: false, error: "El archivo no parece ser una imagen WEBP válida." };
      }

      // HEIC — skip deep check, trust declared MIME
      if (isImage && !isJpeg && !isPng && !isWebp && !file.type.includes("heic") && !file.type.includes("heif")) {
        // unrecognized image signature
        return { valid: false, error: "No se pudo verificar el tipo de imagen." };
      }
    } catch {
      // If we can't read the file, allow it with declared MIME
    }

    return { valid: true };
  }

  /**
   * Converts a File to a data URL string for inline storage.
   */
  static toDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Adds a receipt to an existing list.
   * Enforces MAX_RECEIPTS_PER_TRANSACTION limit.
   */
  static async addReceipt(
    currentUrls: string[],
    file: File
  ): Promise<{ urls: string[]; error?: string }> {
    if (currentUrls.length >= MAX_RECEIPTS_PER_TRANSACTION) {
      return {
        urls: currentUrls,
        error: `Máximo ${MAX_RECEIPTS_PER_TRANSACTION} comprobantes por movimiento.`,
      };
    }

    const validation = await this.validate(file);
    if (!validation.valid) {
      return { urls: currentUrls, error: validation.error };
    }

    const dataUrl = await this.toDataURL(file);
    return { urls: [...currentUrls, dataUrl] };
  }

  /**
   * Removes a receipt by index.
   */
  static removeReceipt(currentUrls: string[], index: number): string[] {
    return currentUrls.filter((_, i) => i !== index);
  }

  /**
   * Replaces a receipt at a given index.
   */
  static async replaceReceipt(
    currentUrls: string[],
    index: number,
    file: File
  ): Promise<{ urls: string[]; error?: string }> {
    const validation = await this.validate(file);
    if (!validation.valid) {
      return { urls: currentUrls, error: validation.error };
    }

    const dataUrl = await this.toDataURL(file);
    const updated = [...currentUrls];
    updated[index] = dataUrl;
    return { urls: updated };
  }

  /**
   * Returns a thumbnail-suitable URL from a data URL or remote URL.
   * For PDFs, returns a placeholder icon URL.
   */
  static getThumbnailUrl(url: string): { type: "image" | "pdf"; src: string } {
    if (!url) return { type: "image", src: "" };
    if (url.startsWith("data:application/pdf") || url.endsWith(".pdf")) {
      return { type: "pdf", src: url };
    }
    return { type: "image", src: url };
  }

  /**
   * Gets a friendly label for the receipt by index.
   */
  static getReceiptLabel(index: number): string {
    const labels = [
      "Comprobante principal",
      "Comprobante adicional",
      "Comprobante extra",
    ];
    return labels[index] || `Comprobante ${index + 1}`;
  }
}
