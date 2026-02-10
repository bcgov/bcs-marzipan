import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import {
  activityCommsContacts,
  activityReportSettings,
  activityRepresentatives,
  governmentRepresentatives,
  reports,
  venueAddresses,
} from '@corpcal/database/schema';
import type { VenueAddress } from '@corpcal/shared/schemas';

import { DatabaseService } from '../../database/database.service';

/**
 * Service for managing activity junction table relationships
 * Handles many-to-many relationships and venue addresses
 */
@Injectable()
export class ActivityJunctionService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Helper function to insert junction table records
   * Reduces code duplication for common junction table insert patterns
   *
   * @param tx - Database transaction
   * @param table - Junction table to insert into
   * @param activityId - ID of the activity
   * @param ids - Array of IDs to create relationships for (can be number[] or string[])
   * @param idMapper - Function to map an ID to the junction table record fields
   * @param currentUserId - ID of the user creating the records
   * @param now - Current timestamp
   */
  async insertJunctionRecords<TId extends number | string>(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    table: any,
    activityId: number,
    ids: TId[] | undefined,
    idMapper: (id: TId) => Record<string, any>,
    currentUserId: number,
    now: Date
  ): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }

    await tx.insert(table).values(
      ids.map((id) => ({
        activityId,
        ...idMapper(id),
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      }))
    );
  }

  /**
   * Helper function to update junction table records
   * Replaces all existing records with the new set (soft delete old, insert new)
   *
   * @param tx - Database transaction
   * @param table - Junction table to update
   * @param activityId - ID of the activity
   * @param ids - Array of IDs to set relationships to (can be number[] or string[])
   * @param idMapper - Function to map an ID to the junction table record fields (must return object with the ID column name)
   * @param idColumnName - Name of the ID column in the junction table (e.g., 'categoryId', 'tagId')
   * @param currentUserId - ID of the user updating the records
   * @param now - Current timestamp
   */
  async updateJunctionRecords<TId extends number | string>(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    table: any,
    activityId: number,
    ids: TId[] | undefined,
    idMapper: (id: TId) => Record<string, any>,
    idColumnName: string,
    currentUserId: number,
    now: Date
  ): Promise<void> {
    // Soft delete all existing records for this activity
    await tx
      .update(table)
      .set({ isActive: false })
      .where(eq(table.activityId, activityId));

    // If new IDs provided, insert them
    if (ids && ids.length > 0) {
      // Check which records already exist (even if inactive) to reactivate vs insert
      const existingRecords = await tx
        .select()
        .from(table)
        .where(eq(table.activityId, activityId));

      const existingIds = new Set(
        existingRecords.map((r: any) => r[idColumnName])
      );

      const toInsert: TId[] = [];
      const toReactivate: TId[] = [];

      for (const id of ids) {
        if (existingIds.has(id)) {
          toReactivate.push(id);
        } else {
          toInsert.push(id);
        }
      }

      // Reactivate existing records
      if (toReactivate.length > 0) {
        for (const id of toReactivate) {
          const idField: Record<string, any> = {};
          idField[idColumnName] = id;
          await tx
            .update(table)
            .set({
              isActive: true,
              timestamp: now,
            })
            .where(
              and(eq(table.activityId, activityId), eq(table[idColumnName], id))
            );
        }
      }

      // Insert new records
      if (toInsert.length > 0) {
        await tx.insert(table).values(
          toInsert.map((id) => ({
            activityId,
            ...idMapper(id),
            isActive: true,
            timestamp: now,
          }))
        );
      }
    }
  }

  /**
   * Insert representatives into activityRepresentatives table
   *
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param representatives - Array of representatives
   *   Supports either representativeId (from lookup table) or representativeName (freeform text)
   * @param now - Current timestamp
   */
  async insertRepresentatives(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    representatives:
      | Array<{
          representativeId?: number;
          representativeName?: string;
        }>
      | undefined,
    now: Date
  ): Promise<void> {
    // Skip if representatives are not provided or empty
    if (
      !representatives ||
      !Array.isArray(representatives) ||
      representatives.length === 0
    ) {
      return;
    }

    // Filter out entries without at least one identifier (representativeId or representativeName)
    const validRepresentatives = representatives.filter(
      (r) =>
        (typeof r.representativeId === 'number' && r.representativeId > 0) ||
        (typeof r.representativeName === 'string' &&
          r.representativeName.trim().length > 0)
    );

    // Skip if no valid representatives after filtering
    if (validRepresentatives.length === 0) {
      return;
    }

    // Fetch representative names from lookup table for entries with representativeId
    const representativeIds = validRepresentatives
      .map((r) => r.representativeId)
      .filter((id): id is number => typeof id === 'number' && id > 0);

    let repMap = new Map<number, string>();
    if (representativeIds.length > 0) {
      const repLookup = await tx
        .select({
          id: governmentRepresentatives.id,
          name: governmentRepresentatives.name,
          displayName: governmentRepresentatives.displayName,
        })
        .from(governmentRepresentatives)
        .where(inArray(governmentRepresentatives.id, representativeIds));

      repMap = new Map(repLookup.map((r) => [r.id, r.displayName || r.name]));
    }

    // Insert representatives with attending status
    await tx.insert(activityRepresentatives).values(
      validRepresentatives.map((rep) => {
        // If representativeId is provided, use lookup name; otherwise use provided representativeName
        const representativeName =
          rep.representativeId && repMap.has(rep.representativeId)
            ? repMap.get(rep.representativeId) || null
            : rep.representativeName || null;

        return {
          activityId,
          representativeId: rep.representativeId || null,
          representativeName,
          isActive: true,
          timestamp: now,
        };
      })
    );
  }

  /**
   * Update representatives
   * Replaces all existing representatives with the new set
   *
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param representatives - Array of representatives
   * @param now - Current timestamp
   */
  async updateRepresentatives(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    representatives:
      | Array<{
          representativeId?: number;
          representativeName?: string;
        }>
      | undefined,
    now: Date
  ): Promise<void> {
    // Soft delete all existing representatives
    await tx
      .update(activityRepresentatives)
      .set({ isActive: false })
      .where(eq(activityRepresentatives.activityId, activityId));

    // If new representatives provided, insert them
    if (representatives && representatives.length > 0) {
      // Filter out entries without at least one identifier
      const validRepresentatives = representatives.filter(
        (r) =>
          (typeof r.representativeId === 'number' && r.representativeId > 0) ||
          (typeof r.representativeName === 'string' &&
            r.representativeName.trim().length > 0)
      );

      if (validRepresentatives.length > 0) {
        // Fetch representative names from lookup table for entries with representativeId
        const representativeIds = validRepresentatives
          .map((r) => r.representativeId)
          .filter((id): id is number => typeof id === 'number' && id > 0);

        let repMap = new Map<number, string>();
        if (representativeIds.length > 0) {
          const repLookup = await tx
            .select({
              id: governmentRepresentatives.id,
              name: governmentRepresentatives.name,
              displayName: governmentRepresentatives.displayName,
            })
            .from(governmentRepresentatives)
            .where(inArray(governmentRepresentatives.id, representativeIds));

          repMap = new Map(
            repLookup.map((r) => [r.id, r.displayName || r.name])
          );
        }

        // Insert new representatives
        await tx.insert(activityRepresentatives).values(
          validRepresentatives.map((rep) => {
            const representativeName =
              rep.representativeId && repMap.has(rep.representativeId)
                ? repMap.get(rep.representativeId) || null
                : rep.representativeName || null;

            return {
              activityId,
              representativeId: rep.representativeId || null,
              representativeName,
              isActive: true,
              timestamp: now,
            };
          })
        );
      }
    }
  }

  /**
   * Insert venue address for an activity
   *
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param venueAddress - Venue address data
   */
  async insertVenueAddress(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    venueAddress: VenueAddress
  ): Promise<void> {
    if (!venueAddress) {
      return;
    }

    await tx.insert(venueAddresses).values({
      activityId,
      venueName: venueAddress.venueName,
      street: venueAddress.street,
      city: venueAddress.city,
      provinceOrState: venueAddress.provinceOrState,
      country: venueAddress.country,
    });
  }

  /**
   * Upsert venue address for an activity
   * Updates existing address or inserts new one
   *
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param venueAddress - Venue address data (null to delete)
   */
  async upsertVenueAddress(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    venueAddress: VenueAddress | null
  ): Promise<void> {
    if (venueAddress === null) {
      // Delete venue address if explicitly set to null
      await tx
        .delete(venueAddresses)
        .where(eq(venueAddresses.activityId, activityId));
      return;
    }

    if (venueAddress === undefined) {
      return;
    }

    // Check if address already exists
    const existingAddress = await tx
      .select()
      .from(venueAddresses)
      .where(eq(venueAddresses.activityId, activityId))
      .limit(1);

    if (existingAddress.length > 0) {
      // Update existing address
      await tx
        .update(venueAddresses)
        .set({
          venueName: venueAddress.venueName,
          street: venueAddress.street,
          city: venueAddress.city,
          provinceOrState: venueAddress.provinceOrState,
          country: venueAddress.country,
        })
        .where(eq(venueAddresses.activityId, activityId));
    } else {
      // Insert new address
      await tx.insert(venueAddresses).values({
        activityId,
        venueName: venueAddress.venueName,
        street: venueAddress.street,
        city: venueAddress.city,
        provinceOrState: venueAddress.provinceOrState,
        country: venueAddress.country,
      });
    }
  }

  /**
   * Create default report settings for a new activity
   * Creates rows for all active reports with omitted=false
   * @param tx - Database transaction
   * @param activityId - ID of the newly created activity
   */
  async createDefaultReportSettings(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number
  ): Promise<void> {
    // Get all active reports
    const activeReports = await tx
      .select({
        id: reports.id,
      })
      .from(reports)
      .where(eq(reports.isActive, true));

    if (activeReports.length === 0) {
      return;
    }

    // Insert default rows for all active reports (omitted=false by default)
    await tx.insert(activityReportSettings).values(
      activeReports.map((report) => ({
        activityId,
        reportId: report.id,
        omitted: false,
      }))
    );
  }

  /**
   * Update report settings for an activity
   * Updates omitted flags for specified activity-report combinations
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param reportSettings - Map of reportId to omitted boolean value
   */
  async updateActivityReportSettings(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    reportSettings: Map<number, boolean>
  ): Promise<void> {
    for (const [reportId, omitted] of reportSettings.entries()) {
      // Check if row exists
      const [existing] = await tx
        .select()
        .from(activityReportSettings)
        .where(
          and(
            eq(activityReportSettings.activityId, activityId),
            eq(activityReportSettings.reportId, reportId)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing row
        await tx
          .update(activityReportSettings)
          .set({ omitted })
          .where(
            and(
              eq(activityReportSettings.activityId, activityId),
              eq(activityReportSettings.reportId, reportId)
            )
          );
      } else {
        // Insert new row
        await tx.insert(activityReportSettings).values({
          activityId,
          reportId,
          omitted,
        });
      }
    }
  }

  /**
   * Insert comms contacts for an activity
   * Validates that exactly one contact has isLead=true
   *
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param commsContacts - Array of comms contacts with userId and isLead flag
   * @param now - Current timestamp
   */
  async insertCommsContacts(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    commsContacts:
      | Array<{
          userId: number;
          isLead?: boolean;
        }>
      | undefined,
    now: Date
  ): Promise<void> {
    if (!commsContacts || commsContacts.length === 0) {
      return;
    }

    // Validate exactly one lead contact
    const leadContacts = commsContacts.filter((c) => c.isLead === true);
    if (leadContacts.length === 0) {
      throw new BadRequestException(
        'Exactly one comms contact must be marked as lead (isLead=true)'
      );
    }
    if (leadContacts.length > 1) {
      throw new BadRequestException(
        'Only one comms contact can be marked as lead (isLead=true)'
      );
    }

    // Insert comms contacts
    await tx.insert(activityCommsContacts).values(
      commsContacts.map((contact) => ({
        activityId,
        userId: contact.userId,
        isLead: contact.isLead ?? false,
        isActive: true,
        timestamp: now,
      }))
    );
  }

  /**
   * Update comms contacts for an activity
   * Replaces all existing contacts with the new set
   * Validates that exactly one contact has isLead=true
   *
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param commsContacts - Array of comms contacts with userId and isLead flag
   * @param now - Current timestamp
   */
  async updateCommsContacts(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    commsContacts:
      | Array<{
          userId: number;
          isLead?: boolean;
        }>
      | undefined,
    now: Date
  ): Promise<void> {
    // Soft delete all existing comms contacts for this activity
    await tx
      .update(activityCommsContacts)
      .set({ isActive: false })
      .where(eq(activityCommsContacts.activityId, activityId));

    // If new contacts provided, validate and insert them
    if (commsContacts && commsContacts.length > 0) {
      // Validate exactly one lead contact
      const leadContacts = commsContacts.filter((c) => c.isLead === true);
      if (leadContacts.length === 0) {
        throw new BadRequestException(
          'Exactly one comms contact must be marked as lead (isLead=true)'
        );
      }
      if (leadContacts.length > 1) {
        throw new BadRequestException(
          'Only one comms contact can be marked as lead (isLead=true)'
        );
      }

      // Check which records already exist (even if inactive) to reactivate vs insert
      const existingRecords = await tx
        .select()
        .from(activityCommsContacts)
        .where(eq(activityCommsContacts.activityId, activityId));

      const existingUserIds = new Set(existingRecords.map((r) => r.userId));

      const toInsert: Array<{ userId: number; isLead: boolean }> = [];
      const toReactivate: Array<{ userId: number; isLead: boolean }> = [];

      for (const contact of commsContacts) {
        if (existingUserIds.has(contact.userId)) {
          toReactivate.push({
            userId: contact.userId,
            isLead: contact.isLead ?? false,
          });
        } else {
          toInsert.push({
            userId: contact.userId,
            isLead: contact.isLead ?? false,
          });
        }
      }

      // Reactivate existing records with updated isLead flag
      for (const contact of toReactivate) {
        await tx
          .update(activityCommsContacts)
          .set({
            isActive: true,
            isLead: contact.isLead,
            timestamp: now,
          })
          .where(
            and(
              eq(activityCommsContacts.activityId, activityId),
              eq(activityCommsContacts.userId, contact.userId)
            )
          );
      }

      // Insert new records
      if (toInsert.length > 0) {
        await tx.insert(activityCommsContacts).values(
          toInsert.map((contact) => ({
            activityId,
            userId: contact.userId,
            isLead: contact.isLead,
            isActive: true,
            timestamp: now,
          }))
        );
      }
    }
  }
}
