/**
 * Unit tests for ReceiptService — Milestone 21: Fotos y Comprobantes.
 *
 * Tests cover:
 * - MIME type validation
 * - File size limit enforcement
 * - Max attachments per transaction
 * - Remove / Replace operations
 * - Thumbnail classification
 * - Label generation
 */

import { describe, it, expect } from "vitest";
import { ReceiptService } from "@/features/receipts/service";

// ─── Browser API Mocks (Node environment) ─────────────────────────────────────

/**
 * FileReader is browser-only. Mock it for Node/Vitest environment.
 * Returns a data: URL from the file's bytes.
 */
(globalThis as any).FileReader = class {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;

  readAsDataURL(file: File) {
    // Simulate async data URL generation
    file.arrayBuffer().then((buf) => {
      const bytes = new Uint8Array(buf);
      const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join("");
      const b64 = globalThis.btoa ? globalThis.btoa(binary) : Buffer.from(binary, "binary").toString("base64");
      this.result = `data:${file.type};base64,${b64}`;
      if (this.onload) this.onload();
    });
  }
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a mock File with specified MIME type and size.
 * If `magicBytes` is provided, they are prepended to the buffer.
 * The buffer is always exactly `sizeBytes` long.
 */
function makeFile(
  name: string,
  mimeType: string,
  sizeBytes: number,
  magicBytes?: Uint8Array
): File {
  const buf = new Uint8Array(sizeBytes);
  if (magicBytes) {
    buf.set(magicBytes.slice(0, Math.min(magicBytes.length, sizeBytes)));
  }
  return new File([buf], name, { type: mimeType });
}

/** JPEG magic bytes header */
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
/** PNG magic bytes header */
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
/** PDF magic bytes header */
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

// ─── Validation tests ─────────────────────────────────────────────────────────

describe("ReceiptService.validate", () => {
  it("accepts a valid JPEG file with correct magic bytes", async () => {
    const file = makeFile("foto.jpg", "image/jpeg", 100_000, JPEG_MAGIC);
    const result = await ReceiptService.validate(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts a valid PNG file", async () => {
    const file = makeFile("image.png", "image/png", 50_000, PNG_MAGIC);
    const result = await ReceiptService.validate(file);
    expect(result.valid).toBe(true);
  });

  it("accepts a valid PDF file", async () => {
    const file = makeFile("recibo.pdf", "application/pdf", 200_000, PDF_MAGIC);
    const result = await ReceiptService.validate(file);
    expect(result.valid).toBe(true);
  });

  it("rejects an unsupported MIME type (GIF)", async () => {
    const file = makeFile("imagen.gif", "image/gif", 1000);
    const result = await ReceiptService.validate(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("no permitido");
  });

  it("rejects an unsupported MIME type (TXT)", async () => {
    const file = makeFile("nota.txt", "text/plain", 200);
    const result = await ReceiptService.validate(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("no permitido");
  });

  it("rejects files exceeding 5MB", async () => {
    const big = makeFile("foto.jpg", "image/jpeg", 6 * 1024 * 1024, JPEG_MAGIC);
    const result = await ReceiptService.validate(big);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("5MB");
  });

  it("accepts files at exactly 5MB limit", async () => {
    const exact = makeFile("foto.jpg", "image/jpeg", 5 * 1024 * 1024, JPEG_MAGIC);
    const result = await ReceiptService.validate(exact);
    expect(result.valid).toBe(true);
  });

  it("rejects a JPEG file with wrong magic bytes (PNG content)", async () => {
    const trickFile = makeFile("fake.jpg", "image/jpeg", 100_000, PNG_MAGIC);
    const result = await ReceiptService.validate(trickFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("JPEG");
  });

  it("rejects a PNG file with wrong magic bytes (JPEG content)", async () => {
    const trickFile = makeFile("fake.png", "image/png", 100_000, JPEG_MAGIC);
    const result = await ReceiptService.validate(trickFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("PNG");
  });

  it("accepts HEIC files by declared MIME without deep check", async () => {
    const heic = makeFile("foto.heic", "image/heic", 2_000_000);
    const result = await ReceiptService.validate(heic);
    expect(result.valid).toBe(true);
  });
});

// ─── addReceipt tests ─────────────────────────────────────────────────────────

describe("ReceiptService.addReceipt", () => {
  it("adds a valid receipt to empty list", async () => {
    const file = makeFile("foto.jpg", "image/jpeg", 100_000, JPEG_MAGIC);
    const result = await ReceiptService.addReceipt([], file);
    expect(result.error).toBeUndefined();
    expect(result.urls.length).toBe(1);
    expect(result.urls[0]).toContain("data:image/jpeg");
  });

  it("allows adding up to MAX_RECEIPTS_PER_TRANSACTION", async () => {
    const file = makeFile("foto.jpg", "image/jpeg", 10_000, JPEG_MAGIC);
    let urls: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await ReceiptService.addReceipt(urls, file);
      expect(r.error).toBeUndefined();
      urls = r.urls;
    }
    expect(urls.length).toBe(3);
  });

  it("refuses to add beyond MAX_RECEIPTS_PER_TRANSACTION", async () => {
    const file = makeFile("foto.jpg", "image/jpeg", 10_000, JPEG_MAGIC);
    const full = ["data:url1", "data:url2", "data:url3"];
    const result = await ReceiptService.addReceipt(full, file);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("3");
    expect(result.urls.length).toBe(3);
  });

  it("propagates validation errors", async () => {
    const badFile = makeFile("big.jpg", "image/jpeg", 6 * 1024 * 1024, JPEG_MAGIC);
    const result = await ReceiptService.addReceipt([], badFile);
    expect(result.error).toContain("5MB");
    expect(result.urls.length).toBe(0);
  });
});

// ─── removeReceipt tests ──────────────────────────────────────────────────────

describe("ReceiptService.removeReceipt", () => {
  it("removes the element at the given index", () => {
    const urls = ["url-a", "url-b", "url-c"];
    const result = ReceiptService.removeReceipt(urls, 1);
    expect(result).toEqual(["url-a", "url-c"]);
  });

  it("removes the first element", () => {
    const urls = ["url-a", "url-b"];
    const result = ReceiptService.removeReceipt(urls, 0);
    expect(result).toEqual(["url-b"]);
  });

  it("removes the last element", () => {
    const urls = ["url-a", "url-b", "url-c"];
    const result = ReceiptService.removeReceipt(urls, 2);
    expect(result).toEqual(["url-a", "url-b"]);
  });

  it("does not mutate the original array", () => {
    const urls = ["url-a", "url-b"];
    const result = ReceiptService.removeReceipt(urls, 0);
    expect(urls.length).toBe(2);
    expect(result.length).toBe(1);
  });
});

// ─── replaceReceipt tests ─────────────────────────────────────────────────────

describe("ReceiptService.replaceReceipt", () => {
  it("replaces a receipt at given index with valid file", async () => {
    const file = makeFile("nuevo.jpg", "image/jpeg", 50_000, JPEG_MAGIC);
    const urls = ["data:old-url", "data:another"];
    const result = await ReceiptService.replaceReceipt(urls, 0, file);
    expect(result.error).toBeUndefined();
    expect(result.urls.length).toBe(2);
    expect(result.urls[0]).toContain("data:image/jpeg");
    expect(result.urls[1]).toBe("data:another");
  });

  it("returns error and unchanged list if file is invalid", async () => {
    const badFile = makeFile("gif.gif", "image/gif", 1000);
    const urls = ["data:old-url"];
    const result = await ReceiptService.replaceReceipt(urls, 0, badFile);
    expect(result.error).toBeDefined();
    expect(result.urls).toEqual(urls);
  });
});

// ─── getThumbnailUrl tests ────────────────────────────────────────────────────

describe("ReceiptService.getThumbnailUrl", () => {
  it("returns image type for JPEG data URL", () => {
    const result = ReceiptService.getThumbnailUrl("data:image/jpeg;base64,abc");
    expect(result.type).toBe("image");
    expect(result.src).toBe("data:image/jpeg;base64,abc");
  });

  it("returns pdf type for PDF data URL", () => {
    const result = ReceiptService.getThumbnailUrl("data:application/pdf;base64,abc");
    expect(result.type).toBe("pdf");
  });

  it("returns pdf type for .pdf extension URL", () => {
    const result = ReceiptService.getThumbnailUrl("https://example.com/file.pdf");
    expect(result.type).toBe("pdf");
  });

  it("returns image type for remote image URL", () => {
    const result = ReceiptService.getThumbnailUrl("https://cdn.example.com/foto.jpg");
    expect(result.type).toBe("image");
  });

  it("handles empty string gracefully", () => {
    const result = ReceiptService.getThumbnailUrl("");
    expect(result.type).toBe("image");
    expect(result.src).toBe("");
  });
});

// ─── getReceiptLabel tests ────────────────────────────────────────────────────

describe("ReceiptService.getReceiptLabel", () => {
  it("returns label for index 0", () => {
    expect(ReceiptService.getReceiptLabel(0)).toBe("Comprobante principal");
  });

  it("returns label for index 1", () => {
    expect(ReceiptService.getReceiptLabel(1)).toBe("Comprobante adicional");
  });

  it("returns label for index 2", () => {
    expect(ReceiptService.getReceiptLabel(2)).toBe("Comprobante extra");
  });

  it("returns fallback for index beyond labels", () => {
    expect(ReceiptService.getReceiptLabel(5)).toContain("6");
  });
});
