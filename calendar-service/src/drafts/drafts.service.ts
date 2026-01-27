import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { schema } from '@corpcal/database';
import { eq, and } from '@corpcal/database';
import { lt, isNull, isNotNull, desc, SQL } from 'drizzle-orm';
import { SaveDraftDto, DraftResponseDto } from './dto/drafts.dto';
import { AppLogger } from '../common/logger/logger.service';

const { formDrafts } = schema;

@Injectable()
export class DraftsService {
  private readonly logger = new AppLogger(DraftsService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Save or update a draft for a user
   * Uses upsert logic: updates if exists, inserts if new
   */
  async saveDraft(
    userId: number,
    saveDto: SaveDraftDto
  ): Promise<DraftResponseDto> {
    const { formType, entityId, draftData } = saveDto;

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Check if draft already exists
    const conditions: SQL[] = [
      eq(formDrafts.userId, userId),
      eq(formDrafts.formType, formType),
    ];
    if (entityId !== undefined) {
      conditions.push(eq(formDrafts.entityId, entityId));
    } else {
      conditions.push(isNull(formDrafts.entityId));
    }

    const existing = await this.db.db
      .select()
      .from(formDrafts)
      .where(and(...conditions))
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update existing draft
      this.logger.log(
        `Updating draft ${existing[0].id} for user ${userId}, form ${formType}`
      );

      const updated = await this.db.db
        .update(formDrafts)
        .set({
          draftData,
          updatedAt: new Date(),
          expiresAt,
        })
        .where(eq(formDrafts.id, existing[0].id))
        .returning();

      result = updated[0];
    } else {
      // Insert new draft
      this.logger.log(
        `Creating new draft for user ${userId}, form ${formType}`
      );

      const inserted = await this.db.db
        .insert(formDrafts)
        .values({
          userId,
          formType,
          entityId: entityId ?? null,
          draftData,
          expiresAt,
        })
        .returning();

      result = inserted[0];
    }

    return this.mapToDto(result);
  }

  /**
   * Get a specific draft by form type and optional entity ID
   */
  async getDraft(
    userId: number,
    formType: string,
    entityId?: number
  ): Promise<DraftResponseDto | null> {
    this.logger.log(
      `Retrieving draft for user ${userId}, form ${formType}, entity ${entityId}`
    );

    const conditions: SQL[] = [
      eq(formDrafts.userId, userId),
      eq(formDrafts.formType, formType),
    ];
    if (entityId !== undefined) {
      conditions.push(eq(formDrafts.entityId, entityId));
    } else {
      conditions.push(isNull(formDrafts.entityId));
    }

    const results = await this.db.db
      .select()
      .from(formDrafts)
      .where(and(...conditions))
      .limit(1);

    return results.length > 0 ? this.mapToDto(results[0]) : null;
  }

  /**
   * Get all drafts for a user
   */
  async listUserDrafts(userId: number): Promise<DraftResponseDto[]> {
    this.logger.log(`Retrieving all drafts for user ${userId}`);

    const results = await this.db.db
      .select()
      .from(formDrafts)
      .where(eq(formDrafts.userId, userId))
      .orderBy(desc(formDrafts.updatedAt));

    return results.map((draft) => this.mapToDto(draft));
  }

  /**
   * Delete a specific draft
   */
  async deleteDraft(userId: number, draftId: number): Promise<void> {
    this.logger.log(`Deleting draft ${draftId} for user ${userId}`);

    const result = await this.db.db
      .delete(formDrafts)
      .where(
        and(
          eq(formDrafts.id, draftId),
          eq(formDrafts.userId, userId) // Security: ensure user owns draft
        )
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(
        `Draft with ID ${draftId} not found or does not belong to user ${userId}`
      );
    }

    this.logger.log(`Successfully deleted draft ${draftId}`);
  }

  /**
   * Delete a draft by form type and entity ID
   */
  async deleteDraftByForm(
    userId: number,
    formType: string,
    entityId?: number
  ): Promise<void> {
    this.logger.log(
      `Deleting draft for user ${userId}, form ${formType}, entity ${entityId}`
    );

    const conditions: SQL[] = [
      eq(formDrafts.userId, userId),
      eq(formDrafts.formType, formType),
    ];
    if (entityId !== undefined) {
      conditions.push(eq(formDrafts.entityId, entityId));
    } else {
      conditions.push(isNull(formDrafts.entityId));
    }

    const result = await this.db.db
      .delete(formDrafts)
      .where(and(...conditions))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Draft not found for form type ${formType}`);
    }

    this.logger.log(`Successfully deleted draft for form ${formType}`);
  }

  /**
   * Cleanup expired drafts (to be called by a scheduled job)
   */
  async cleanupExpiredDrafts(): Promise<number> {
    this.logger.log('Running cleanup job for expired drafts');

    const now = new Date();
    const result = await this.db.db
      .delete(formDrafts)
      .where(
        and(isNotNull(formDrafts.expiresAt), lt(formDrafts.expiresAt, now))
      )
      .returning();

    const count = result.length;
    this.logger.log(`Cleaned up ${count} expired drafts`);

    return count;
  }

  /**
   * Map database record to DTO
   */
  private mapToDto(draft: typeof formDrafts.$inferSelect): DraftResponseDto {
    return {
      id: draft.id,
      userId: draft.userId,
      formType: draft.formType,
      entityId: draft.entityId,
      draftData: draft.draftData as Record<string, any>,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      expiresAt: draft.expiresAt,
    };
  }
}
