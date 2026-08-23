import { describe, it, expect, beforeEach } from "vitest";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ExpenseService } from "@/features/expenses/service";

describe("Milestone 03: Participant Management & Integrity", () => {
  let serruchoId: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Viaje a Samaná 🌴",
      description: "Prueba de participantes",
      currency: "DOP",
      creator_name: "Organizador",
    });
    serruchoId = serrucho.id;
  });

  it("allows creating a guest participant without email or registered account", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Carlos",
      preferred_channel: "WHATSAPP",
    });

    expect(participant.id).toBeDefined();
    expect(participant.name).toBe("Carlos");
    expect(participant.email).toBeNull();
    expect(participant.phone).toBeNull();
  });

  it("supports Dominican phone format and international numbers", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Laura Gómez",
      phone: "+18295550199",
      preferred_channel: "WHATSAPP",
    });

    expect(participant.phone).toBe("+18295550199");
  });

  it("allows updating participant name and phone", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Marcos",
      preferred_channel: "EMAIL",
    });

    const updated = await ParticipantService.update(participant.id, {
      name: "Marcos Antonio",
      phone: "8095551234",
    });

    expect(updated.name).toBe("Marcos Antonio");
    expect(updated.phone).toBe("8095551234");
  });

  it("allows safe deletion of participants without expenses or debts", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Amigo Invitado",
      preferred_channel: "WHATSAPP",
    });

    const deleted = await ParticipantService.delete(participant.id);
    expect(deleted).toBe(true);

    const list = await ParticipantService.listBySerrucho(serruchoId);
    expect(list.some((p) => p.id === participant.id)).toBe(false);
  });

  it("BLOCKS deletion of participant if they paid an expense (financial integrity)", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Pagador Principal",
      preferred_channel: "WHATSAPP",
    });

    // Add an expense paid by this participant
    await ExpenseService.add(serruchoId, {
      description: "Supermercado",
      amount: 4500,
      paid_by_participant_id: participant.id,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      category: "FOOD_GROCERIES",
      splits: [{ participant_id: participant.id }],
    });

    await expect(ParticipantService.delete(participant.id)).rejects.toThrow(
      /No puedes eliminar un participante que tiene gastos o deudas registradas/
    );
  });
});
