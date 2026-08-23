import { getRepository } from "@/lib/store";
import { Profile, Serrucho, Participant } from "@/lib/types/domain";

export class AuthService {
  /**
   * Retrieves user profile by ID.
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    const repo = getRepository();
    return repo.getProfile(userId);
  }

  /**
   * Creates or updates a user profile with personal info and default payment instructions.
   */
  static async upsertProfile(data: {
    id: string;
    email: string;
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    default_payment_instructions?: string | null;
  }): Promise<Profile> {
    const repo = getRepository();
    const existing = await repo.getProfile(data.id);
    const now = new Date().toISOString();

    const profile: Profile = {
      id: data.id,
      email: data.email,
      full_name: data.full_name !== undefined ? data.full_name : existing?.full_name ?? null,
      phone: data.phone !== undefined ? data.phone : existing?.phone ?? null,
      avatar_url: data.avatar_url !== undefined ? data.avatar_url : existing?.avatar_url ?? null,
      default_payment_instructions:
        data.default_payment_instructions !== undefined
          ? data.default_payment_instructions
          : existing?.default_payment_instructions ?? null,
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    return repo.upsertProfile(profile);
  }

  /**
   * Retrieves all Serruchos associated with a user (both as creator/owner and as a participant).
   */
  static async getUserSerruchos(userId: string): Promise<Serrucho[]> {
    const repo = getRepository();
    return repo.getSerruchosByUser(userId);
  }

  /**
   * Securely links an anonymous/guest participant to a registered user account.
   * Prevents hijacking: does not overwrite if already linked to another active account.
   */
  static async linkGuestParticipant(
    userId: string,
    serruchoId: string,
    participantId: string
  ): Promise<Participant> {
    const repo = getRepository();
    const participant = await repo.getParticipantById(participantId);
    if (!participant) {
      throw new Error("Participante no encontrado");
    }

    if (participant.serrucho_id !== serruchoId) {
      throw new Error("El participante no pertenece a este Serrucho");
    }

    // Security check: if already linked to another user ID, disallow hijacking
    if (participant.user_id && participant.user_id !== userId) {
      throw new Error("Este participante ya está vinculado a otra cuenta");
    }

    return repo.updateParticipant(participantId, {
      user_id: userId,
      access_status: "LINKED_ACCOUNT",
      last_seen_at: new Date().toISOString(),
    });
  }

  /**
   * Batch links all local guest sessions and recent Serruchos stored on this device to the user account.
   */
  static async linkLocalGuestSessions(
    userId: string,
    items: Array<{ serruchoId: string; participantId?: string | null; isCreator?: boolean }>
  ): Promise<{ linkedParticipants: number; linkedSerruchos: number }> {
    const repo = getRepository();
    let linkedParticipants = 0;
    let linkedSerruchos = 0;

    for (const item of items) {
      if (!item.serruchoId) continue;

      // 1. Link participant if provided
      if (item.participantId) {
        try {
          const part = await repo.getParticipantById(item.participantId);
          if (part && part.serrucho_id === item.serruchoId && (!part.user_id || part.user_id === userId)) {
            await repo.updateParticipant(part.id, {
              user_id: userId,
              access_status: "LINKED_ACCOUNT",
            });
            linkedParticipants++;
          }
        } catch {
          // Ignore individual linking error to continue batch
        }
      }

      // 2. Link serrucho ownership if created as guest
      if (item.isCreator) {
        try {
          const s = await repo.getSerruchoById(item.serruchoId);
          if (s && (!s.owner_id || s.owner_id === "guest-anonymous" || s.owner_id === userId)) {
            await repo.updateSerrucho(s.id, { owner_id: userId });
            linkedSerruchos++;
          }
        } catch {
          // Ignore
        }
      }
    }

    return { linkedParticipants, linkedSerruchos };
  }

  /**
   * Deletes a user account and personal profile, unlinking participant records.
   */
  static async deleteAccount(userId: string): Promise<boolean> {
    const repo = getRepository();
    return repo.deleteProfile(userId);
  }
}

