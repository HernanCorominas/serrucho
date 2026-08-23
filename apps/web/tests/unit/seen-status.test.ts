import { describe, it, expect, beforeEach } from "vitest";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { SettlementService } from "@/features/settlements/service";
import { ACCESS_STATUS_INFO } from "@/lib/types/domain";

describe("Milestone 20: Participant Access & Seen Status", () => {
  let serruchoId: string;
  let pCreatorId: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Viaje a Samaná 🌴",
      currency: "DOP",
      creator_name: "Braulio",
    });
    serruchoId = serrucho.id;

    const participants = await ParticipantService.listBySerrucho(serruchoId);
    pCreatorId = participants[0].id;
  });

  it("initializes creator as IDENTIFIED and new participants as INVITED", async () => {
    const creator = await ParticipantService.getById(pCreatorId);
    expect(creator).toBeDefined();
    expect(creator?.access_status).toBe("IDENTIFIED");
    expect(creator?.last_seen_at).toBeTruthy();

    const invitee = await ParticipantService.add(serruchoId, {
      name: "Marcos",
      preferred_channel: "WHATSAPP",
    });

    expect(invitee.access_status).toBe("INVITED");
    expect(invitee.last_seen_at).toBeNull();
  });

  it("advances access status from INVITED -> ACCESSED -> IDENTIFIED -> LINKED_ACCOUNT", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Diana",
      preferred_channel: "WHATSAPP",
    });

    expect(participant.access_status).toBe("INVITED");

    // 1. Participant opens link (ACCESSED)
    const accessed = await ParticipantService.markSeen(participant.id, "ACCESSED");
    expect(accessed.access_status).toBe("ACCESSED");
    expect(accessed.last_seen_at).toBeTruthy();

    // 2. Participant identifies themselves (IDENTIFIED)
    const identified = await ParticipantService.markSeen(participant.id, "IDENTIFIED");
    expect(identified.access_status).toBe("IDENTIFIED");

    // 3. User links their account (LINKED_ACCOUNT)
    const linked = await ParticipantService.linkAccount(participant.id, "usr-999");
    expect(linked.access_status).toBe("LINKED_ACCOUNT");
    expect(linked.user_id).toBe("usr-999");
  });

  it("prevents status downgrades when marking seen again", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Pedro",
      preferred_channel: "EMAIL",
    });

    await ParticipantService.markSeen(participant.id, "IDENTIFIED");

    // Calling ACCESSED should not downgrade IDENTIFIED
    const refreshed = await ParticipantService.markSeen(participant.id, "ACCESSED");
    expect(refreshed.access_status).toBe("IDENTIFIED");
    expect(refreshed.last_seen_at).toBeTruthy();
  });

  it("has complete UI status mapping with emojis and friendly labels", () => {
    expect(ACCESS_STATUS_INFO.INVITED.label).toBe("Invitado");
    expect(ACCESS_STATUS_INFO.ACCESSED.label).toBe("Accedió");
    expect(ACCESS_STATUS_INFO.IDENTIFIED.label).toBe("Identificado");
    expect(ACCESS_STATUS_INFO.LINKED_ACCOUNT.label).toBe("Cuenta vinculada");

    expect(ACCESS_STATUS_INFO.INVITED.emoji).toBeTruthy();
    expect(ACCESS_STATUS_INFO.ACCESSED.emoji).toBeTruthy();
  });

  it("ensures seen status never mutates financial balances", async () => {
    const participant = await ParticipantService.add(serruchoId, {
      name: "Elena",
      preferred_channel: "WHATSAPP",
    });

    const before = await SettlementService.calculateLiveSettlement(serruchoId);
    await ParticipantService.markSeen(participant.id, "ACCESSED");
    await ParticipantService.markSeen(participant.id, "IDENTIFIED");
    const after = await SettlementService.calculateLiveSettlement(serruchoId);

    expect(before.totalExpensesCents).toBe(after.totalExpensesCents);
    expect(before.participants.length).toBe(after.participants.length);
  });
});
