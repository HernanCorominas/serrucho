import { getRepository } from "@/lib/store";
import { ActivityEvent, ActivityActionType, ActivityEntityType } from "@/lib/types/domain";

export class ActivityService {
  /**
   * Records an audit event into the serrucho activity log.
   */
  static async record(event: {
    serrucho_id: string;
    actor_name?: string;
    action_type: ActivityActionType;
    entity_type: ActivityEntityType;
    entity_id?: string | null;
    summary: string;
    metadata?: Record<string, any> | null;
  }): Promise<ActivityEvent> {
    const repo = getRepository();
    return repo.createActivityEvent({
      serrucho_id: event.serrucho_id,
      actor_name: event.actor_name || "Alguien",
      action_type: event.action_type,
      entity_type: event.entity_type,
      entity_id: event.entity_id || null,
      summary: event.summary,
      metadata: event.metadata || null,
    });
  }

  /**
   * Retrieves recent activity events for a Serrucho.
   */
  static async listBySerrucho(serruchoId: string, limit: number = 100): Promise<ActivityEvent[]> {
    const repo = getRepository();
    return repo.getActivityEvents(serruchoId, limit);
  }
}
