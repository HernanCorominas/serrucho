import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { generateReadOnlyToken } from "@/lib/security/tokens";
import {
  isReadOnlyToken,
  assertWritePermission,
  ReadOnlyPermissionError,
  handleApiError,
} from "@/lib/security/permissions";
import { SerruchoService } from "@/features/serruchos/service";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 23: Read-Only Access (Acceso de solo lectura)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Token Generation and Retrieval", () => {
    it("generates a 32-character hexadecimal read-only token", () => {
      const token1 = generateReadOnlyToken();
      const token2 = generateReadOnlyToken();

      expect(token1).toHaveLength(32);
      expect(token2).toHaveLength(32);
      expect(token1).not.toBe(token2);
    });

    it("automatically assigns a read_only_token on Serrucho creation", async () => {
      const serrucho = await SerruchoService.create("owner-123", {
        name: "Viaje a Las Terrenas",
        currency: "DOP",
      });

      expect(serrucho.read_only_token).toBeDefined();
      expect(serrucho.read_only_token?.length).toBeGreaterThan(10);
    });

    it("retrieves a serrucho by its read_only_token", async () => {
      const serrucho = await SerruchoService.create("owner-123", {
        name: "Coro en Jarabacoa",
        currency: "DOP",
      });

      const token = serrucho.read_only_token!;
      expect(token).toBeDefined();

      const found = await SerruchoService.getByReadOnlyToken(token);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(serrucho.id);
      expect(found?.name).toBe("Coro en Jarabacoa");
    });

    it("returns null for non-existent or empty read_only_token", async () => {
      const invalid = await SerruchoService.getByReadOnlyToken("non-existent-token-123");
      expect(invalid).toBeNull();

      const empty = await SerruchoService.getByReadOnlyToken("");
      expect(empty).toBeNull();
    });
  });

  describe("Read-Only Permission Verification", () => {
    it("correctly identifies valid and invalid read-only tokens for a serrucho", async () => {
      const serrucho = await SerruchoService.create("owner-123", {
        name: "Parrillada en Ocoa",
        currency: "DOP",
      });

      const isReadOnly = await isReadOnlyToken(serrucho.id, serrucho.read_only_token);
      expect(isReadOnly).toBe(true);

      const isNotReadOnly = await isReadOnlyToken(serrucho.id, "fake-token");
      expect(isNotReadOnly).toBe(false);

      const nullCheck = await isReadOnlyToken(serrucho.id, null);
      expect(nullCheck).toBe(false);
    });

    it("allows write access when no read-only token or flag is present", async () => {
      const serrucho = await SerruchoService.create("owner-123", {
        name: "Cena de Cumpleaños",
        currency: "DOP",
      });

      const req = new NextRequest(`http://localhost:3000/api/serruchos/${serrucho.id}/expenses`, {
        method: "POST",
      });

      await expect(assertWritePermission(serrucho.id, req)).resolves.toBeUndefined();
    });

    it("rejects write access with ReadOnlyPermissionError when header x-read-only-token matches", async () => {
      const serrucho = await SerruchoService.create("owner-123", {
        name: "Cena de Cumpleaños",
        currency: "DOP",
      });

      const req = new NextRequest(`http://localhost:3000/api/serruchos/${serrucho.id}/expenses`, {
        method: "POST",
        headers: {
          "x-read-only-token": serrucho.read_only_token!,
        },
      });

      await expect(assertWritePermission(serrucho.id, req)).rejects.toThrow(
        ReadOnlyPermissionError
      );
    });

    it("rejects write access with ReadOnlyPermissionError when ?ro= parameter matches", async () => {
      const serrucho = await SerruchoService.create("owner-123", {
        name: "Cena de Cumpleaños",
        currency: "DOP",
      });

      const req = new NextRequest(
        `http://localhost:3000/api/serruchos/${serrucho.id}/expenses?ro=${serrucho.read_only_token}`,
        { method: "POST" }
      );

      await expect(assertWritePermission(serrucho.id, req)).rejects.toThrow(
        ReadOnlyPermissionError
      );
    });

    it("rejects write access when ?readonly=true or ?readonly=1 is passed", async () => {
      const serrucho = await SerruchoService.create("owner-123", {
        name: "Cena de Cumpleaños",
        currency: "DOP",
      });

      const req1 = new NextRequest(
        `http://localhost:3000/api/serruchos/${serrucho.id}/expenses?readonly=true`,
        { method: "POST" }
      );
      await expect(assertWritePermission(serrucho.id, req1)).rejects.toThrow(
        ReadOnlyPermissionError
      );

      const req2 = new NextRequest(
        `http://localhost:3000/api/serruchos/${serrucho.id}/expenses?readonly=1`,
        { method: "POST" }
      );
      await expect(assertWritePermission(serrucho.id, req2)).rejects.toThrow(
        ReadOnlyPermissionError
      );
    });

    it("handles API error by returning HTTP 403 Forbidden for ReadOnlyPermissionError", () => {
      const err = new ReadOnlyPermissionError("Modificación no permitida");
      const response = handleApiError(err);

      expect(response.status).toBe(403);
    });

    it("handles generic API errors by returning HTTP 400 Bad Request", () => {
      const err = new Error("Datos inválidos");
      const response = handleApiError(err);

      expect(response.status).toBe(400);
    });
  });
});
