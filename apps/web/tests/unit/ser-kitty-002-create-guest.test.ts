import { describe, it, expect, beforeEach } from "vitest";
import { SerruchoService } from "@/features/serruchos/service";
import { getRepository } from "@/lib/store";
import { generateSerruchoInviteMessage, buildWhatsAppShareUrl } from "@serrucho/core";

describe("PROMPT 02 — Create Serrucho & Guest Access Test Matrix", () => {
  beforeEach(async () => {
    const repo = getRepository();
    if (typeof (repo as any).clear === "function") {
      (repo as any).clear();
    }
  });

  // CREATE-01: Crear Serrucho con nombre válido
  it("CREATE-01: creates serrucho with valid name", async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Fin de Semana en Las Terrenas 🌴",
      creator_name: "Braulio",
    });

    expect(serrucho).toBeDefined();
    expect(serrucho.id).toBeDefined();
    expect(serrucho.name).toBe("Fin de Semana en Las Terrenas 🌴");
    expect(serrucho.status).toBe("OPEN");
  });

  // CREATE-02: Nombre vacío o solo espacios
  it("CREATE-02: fails validation when name is empty or whitespace only", async () => {
    await expect(
      SerruchoService.create("guest-owner", {
        name: "   ",
        creator_name: "Braulio",
      })
    ).rejects.toThrow();

    await expect(
      SerruchoService.create("guest-owner", {
        name: "",
        creator_name: "Braulio",
      })
    ).rejects.toThrow();
  });

  // CREATE-03: Crear con varios participantes
  it("CREATE-03: creates all initial participants correctly", async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Cena de Amigos",
      creator_name: "Carlos",
      initial_participants: ["Laura", "Marcos", "Paola"],
    });

    const repo = getRepository();
    const participants = await repo.getParticipants(serrucho.id);

    expect(participants).toHaveLength(4);
    const names = participants.map((p) => p.name);
    expect(names).toContain("Carlos");
    expect(names).toContain("Laura");
    expect(names).toContain("Marcos");
    expect(names).toContain("Paola");
  });

  // CREATE-04: Crear sin cuenta (Guest Mode)
  it("CREATE-04: creates group in guest mode without requiring email, password, or OAuth", async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Coro Rápido",
      creator_name: "Hernan",
    });

    expect(serrucho.id).toBeDefined();
    expect(serrucho.name).toBe("Coro Rápido");

    const loaded = await SerruchoService.getById(serrucho.id);
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(serrucho.id);
  });

  // CREATE-05: Crear con DOP como moneda predeterminada
  it("CREATE-05: defaults to DOP and accepts other currencies", async () => {
    const serruchoDOP = await SerruchoService.create("guest-owner", {
      name: "Viaje Local",
      creator_name: "Braulio",
    });
    expect(serruchoDOP.currency).toBe("DOP");

    const serruchoUSD = await SerruchoService.create("guest-owner", {
      name: "Viaje Internacional",
      creator_name: "Braulio",
      currency: "USD",
    });
    expect(serruchoUSD.currency).toBe("USD");
  });

  // CREATE-06: Abrir Serrucho recién creado
  it("CREATE-06: newly created serrucho is immediately accessible and open", async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Punta Cana Beach Trip",
      creator_name: "David",
    });

    const fetched = await SerruchoService.getById(serrucho.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.status).toBe("OPEN");
  });

  // JOIN-01 & JOIN-02: Abrir enlace válido sin autenticación
  it("JOIN-01 & JOIN-02: guest access allows retrieving serrucho and participants without login", async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Barbacoa Familiar",
      creator_name: "Tío Juan",
      initial_participants: ["Primo Pedro", "Tía María"],
    });

    const repo = getRepository();
    const loadedSerrucho = await repo.getSerruchoById(serrucho.id);
    const loadedParticipants = await repo.getParticipants(serrucho.id);

    expect(loadedSerrucho).toBeDefined();
    expect(loadedParticipants).toHaveLength(3);
  });

  // JOIN-03 & JOIN-04: Selección de identidad y persistencia
  it("JOIN-03 & JOIN-04: allows updating participant access status and remembering identity", async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Cumpleaños",
      creator_name: "Anfitrión",
      initial_participants: ["Invitado 1", "Invitado 2"],
    });

    const repo = getRepository();
    const participants = await repo.getParticipants(serrucho.id);
    const target = participants.find((p) => p.name === "Invitado 1");
    expect(target).toBeDefined();

    // Mark as identified
    const updated = await repo.updateParticipant(target!.id, {
      access_status: "IDENTIFIED",
      last_seen_at: new Date().toISOString(),
    });

    expect(updated.access_status).toBe("IDENTIFIED");
    expect(updated.last_seen_at).toBeDefined();
  });

  // JOIN-05: Compartir Serrucho por WhatsApp
  it("JOIN-05: generates WhatsApp share link with cordial RD invite message", () => {
    const serruchoName = "Villa Jarabacoa 🌄";
    const joinUrl = "https://serrucho.do/k/serrucho-12345";
    const message = generateSerruchoInviteMessage({ serruchoName, joinUrl });

    expect(message).toContain("Villa Jarabacoa 🌄");
    expect(message).toContain("https://serrucho.do/k/serrucho-12345");
    expect(message).toContain("Serrucho");

    const waUrl = buildWhatsAppShareUrl(message);
    expect(waUrl).toContain("https://wa.me/?text=");
    expect(waUrl).toContain("Villa%20Jarabacoa");
  });

  // JOIN-06: Mobile identity behavior (participants remain unselected until user picks)
  it("JOIN-06: initial invited participants have INVITED status and no forced user_id", async () => {
    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Coro Domingo",
      creator_name: "Braulio",
      initial_participants: ["Amigo A", "Amigo B"],
    });

    const repo = getRepository();
    const participants = await repo.getParticipants(serrucho.id);
    const invited = participants.filter((p) => p.name !== "Braulio");

    expect(invited).toHaveLength(2);
    invited.forEach((p) => {
      expect(p.access_status).toBe("INVITED");
      expect(p.user_id).toBeFalsy();
    });
  });

  // JOIN-07: Authenticated user retains full guest mode support
  it("JOIN-07: authenticated user creation links owner but does not break guest participants", async () => {
    const serrucho = await SerruchoService.create("auth-user-999", {
      name: "Viaje de Trabajo",
      creator_name: "Gerente",
      initial_participants: ["Colega 1", "Colega 2"],
    });

    const repo = getRepository();
    const participants = await repo.getParticipants(serrucho.id);
    const ownerParticipant = participants.find((p) => p.name === "Gerente");
    const guestParticipants = participants.filter((p) => p.name !== "Gerente");

    expect(ownerParticipant?.user_id).toBe("auth-user-999");
    expect(guestParticipants).toHaveLength(2);
    guestParticipants.forEach((p) => {
      expect(p.user_id).toBeFalsy();
      expect(p.access_status).toBe("INVITED");
    });
  });
});
