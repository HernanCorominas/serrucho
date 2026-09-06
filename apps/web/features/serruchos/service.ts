import { getRepository } from "@/lib/store";
import { Serrucho } from "@/lib/types/domain";
import { serruchoSchema, SerruchoInput } from "@/lib/validations/schemas";

import { ActivityService } from "@/features/activity/service";

export class SerruchoService {
  static async listByOwner(ownerId: string): Promise<Serrucho[]> {
    const repo = getRepository();
    return repo.getSerruchosByOwner(ownerId);
  }

  static async getById(id: string): Promise<Serrucho | null> {
    const repo = getRepository();
    return repo.getSerruchoById(id);
  }

  static async create(ownerId: string, input: SerruchoInput): Promise<Serrucho> {
    const validated = serruchoSchema.parse(input);
    const repo = getRepository();
    const serrucho = await repo.createSerrucho({
      owner_id: ownerId,
      name: validated.name,
      description: validated.description || null,
      currency: validated.currency || "DOP",
      event_date: validated.event_date || null,
      status: "OPEN",
      payment_instructions: null,
      payment_deadline: null,
    });

    const creatorName = validated.creator_name?.trim() || "Tú (Organizador)";
    const isRegistered = ownerId && ownerId !== "guest-owner";
    await repo.createParticipant({
      serrucho_id: serrucho.id,
      name: creatorName,
      email: validated.creator_email ? validated.creator_email.trim().toLowerCase() : null,
      phone: null,
      preferred_channel: "EMAIL",
      user_id: isRegistered ? ownerId : null,
      access_status: isRegistered ? "LINKED_ACCOUNT" : "IDENTIFIED",
      last_seen_at: new Date().toISOString(),
    });

    if (validated.initial_participants && Array.isArray(validated.initial_participants)) {
      for (const pName of validated.initial_participants) {
        const clean = typeof pName === "string" ? pName.trim() : "";
        if (clean && clean !== creatorName) {
          await repo.createParticipant({
            serrucho_id: serrucho.id,
            name: clean,
            email: null,
            phone: null,
            preferred_channel: "EMAIL",
            access_status: "INVITED",
            last_seen_at: null,
            user_id: null,
          });
        }
      }
    }

    return serrucho;
  }

  static async update(id: string, input: Partial<SerruchoInput>): Promise<Serrucho> {
    const repo = getRepository();
    const existing = await repo.getSerruchoById(id);
    if (!existing) throw new Error("Serrucho no encontrado");
    if (existing.status === "CLOSED") {
      throw new Error("No se puede modificar un serrucho que ya está cerrado");
    }

    let cleanName: string | undefined;
    if (input.name !== undefined) {
      cleanName = input.name.trim();
      if (!cleanName) {
        throw new Error("El nombre no puede estar vacío");
      }
      if (cleanName.length > 100) {
        throw new Error("El nombre no puede exceder 100 caracteres");
      }
    }

    if (input.currency !== undefined && input.currency !== existing.currency) {
      const expenses = await repo.getExpenses(id);
      if (expenses.length > 0) {
        throw new Error("No se puede cambiar la moneda base de un serrucho con gastos existentes");
      }
    }

    const updated = await repo.updateSerrucho(id, {
      ...(cleanName ? { name: cleanName } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.event_date !== undefined ? { event_date: input.event_date } : {}),
    });

    if (cleanName && cleanName !== existing.name) {
      await ActivityService.record({
        serrucho_id: id,
        actor_name: "Organizador",
        action_type: "SERRUCHO_UPDATED",
        entity_type: "SERRUCHO",
        entity_id: id,
        summary: `Se actualizó el nombre del serrucho a "${cleanName}"`,
      });
    }

    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    const repo = getRepository();
    return repo.deleteSerrucho(id);
  }

  static async getByReadOnlyToken(token: string): Promise<Serrucho | null> {
    if (!token || token.trim().length === 0) return null;
    const repo = getRepository();
    return repo.getSerruchoByReadOnlyToken(token.trim());
  }

  static async getReadOnlyToken(id: string): Promise<string> {
    const repo = getRepository();
    const serrucho = await repo.getSerruchoById(id);
    if (!serrucho) throw new Error("Serrucho no encontrado");
    if (serrucho.read_only_token) return serrucho.read_only_token;

    const token = `ro-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const updated = await repo.updateSerrucho(id, { read_only_token: token });
    return updated.read_only_token || token;
  }
}

