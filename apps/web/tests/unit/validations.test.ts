import { describe, it, expect } from "vitest";
import {
  serruchoSchema,
  participantSchema,
  expenseSchema,
  closeSerruchoSchema,
} from "@/lib/validations/schemas";

describe("Zod Validation Schemas", () => {
  describe("serruchoSchema", () => {
    it("validates valid serrucho input", () => {
      const result = serruchoSchema.safeParse({
        name: "Playa Las Terrenas",
        description: "Comida y villa",
        event_date: "2026-08-25",
      });
      expect(result.success).toBe(true);
    });

    it("fails if name is too short", () => {
      const result = serruchoSchema.safeParse({ name: "A" });
      expect(result.success).toBe(false);
    });
  });

  describe("participantSchema", () => {
    it("validates participant with email and phone", () => {
      const result = participantSchema.safeParse({
        name: "Juan Pérez",
        email: "juan@example.com",
        phone: "8095550101",
        preferred_channel: "EMAIL",
      });
      expect(result.success).toBe(true);
    });

    it("allows optional/empty email and phone", () => {
      const result = participantSchema.safeParse({
        name: "Pedro",
        email: "",
        phone: "",
        preferred_channel: "EMAIL",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("expenseSchema", () => {
    it("validates equal split expense", () => {
      const result = expenseSchema.safeParse({
        description: "Cena",
        amount: 2500,
        paid_by_participant_id: "p-1",
        expense_date: "2026-08-20",
        split_method: "EQUAL",
        splits: [{ participant_id: "p-1" }, { participant_id: "p-2" }],
      });
      expect(result.success).toBe(true);
    });

    it("validates percentage split expense when sum is 100%", () => {
      const result = expenseSchema.safeParse({
        description: "Cena",
        amount: 2500,
        paid_by_participant_id: "p-1",
        expense_date: "2026-08-20",
        split_method: "PERCENTAGE",
        splits: [
          { participant_id: "p-1", percentage: 60 },
          { participant_id: "p-2", percentage: 40 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("fails percentage split when sum is not 100%", () => {
      const result = expenseSchema.safeParse({
        description: "Cena",
        amount: 2500,
        paid_by_participant_id: "p-1",
        expense_date: "2026-08-20",
        split_method: "PERCENTAGE",
        splits: [
          { participant_id: "p-1", percentage: 50 },
          { participant_id: "p-2", percentage: 40 },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("closeSerruchoSchema", () => {
    it("requires payment instructions, deadline and confirmation", () => {
      const result = closeSerruchoSchema.safeParse({
        payment_instructions: "Transferir a Banco BHD 123456",
        payment_deadline: "2026-08-30",
        confirm: true,
      });
      expect(result.success).toBe(true);
    });

    it("fails if confirm is false", () => {
      const result = closeSerruchoSchema.safeParse({
        payment_instructions: "Transferir a Banco BHD 123456",
        payment_deadline: "2026-08-30",
        confirm: false,
      });
      expect(result.success).toBe(false);
    });
  });
});
