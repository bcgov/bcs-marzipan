import { Injectable, Logger } from '@nestjs/common';

import type { Activity } from '@corpcal/database/types';
import {
  DEFAULT_LOOK_AHEAD_SECTION,
  DEFAULT_LOOK_AHEAD_STATUS,
  DEFAULT_STATUS,
  DEFAULT_VISIBILITY,
  LOOK_AHEAD_SECTION,
  LOOK_AHEAD_STATUS,
  type ActivityResponse,
  type LookAheadSection,
  type LookAheadStatus,
  type Visibility,
} from '@corpcal/shared';
import { activityResponseSchema } from '@corpcal/shared/schemas';

/**
 * Service for mapping database Activity entities to API ActivityResponse DTOs
 */
@Injectable()
export class ActivityMapperService {
  private readonly logger = new Logger(ActivityMapperService.name);

  /**
   * Map database Activity to API ActivityResponse
   * Validates against Zod schema to ensure DTO matches schema contract
   */
  mapToResponseDto(
    activity: Activity,
    relatedData?: {
      categories?: string[];
      categoryIds?: number[];
      tags?: Array<{ id: number; text: string }>;
      activityStatus?: string;
      dateStatus?: string;
      timeStatus?: string;
      newsReleaseOrigin?: string | null;
      newsReleaseDistribution?: string | null;
      premierRequested?: string | null;
      venueAddress?: {
        venueName: string | null;
        street: string | null;
        city: string | null;
        provinceOrState: string | null;
        country: string | null;
      } | null;
      commsMaterials?: string[];
      translationsRequired?: string[];
      representativesAttending?: string[];
      sharedWith?: string[];
      commsContacts?: Array<{
        userId: number;
        name: string;
        isLead: boolean;
      }>;
      eventLeadName?: string | null;
      leadOrgName?: string | null;
      reportSettings?: Array<{
        id: number;
        name: string;
        displayName: string;
        omitted: boolean;
      }>;
    }
  ): ActivityResponse {
    // Format date to YYYY-MM-DD
    const formatDate = (date: Date | string | null): string | null => {
      if (!date) return null;
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0] ?? null;
    };

    // Format time to HH:mm
    const formatTime = (time: string | null): string | null => {
      if (!time) return null;
      // If it's already in HH:mm format, return as is
      if (time.match(/^\d{2}:\d{2}$/)) return time;
      // If it's a full time string, extract HH:mm
      return time.substring(0, 5);
    };

    const dto: ActivityResponse = {
      id: activity.id,
      displayId: activity.displayId ?? null,

      // Activity status and category
      activityStatusId: activity.activityStatusId ?? 0,
      dateStatusId: activity.dateStatusId ?? 0,
      timeStatusId: activity.timeStatusId ?? 0,
      category: relatedData?.categories ?? [],

      // Basic info
      title: activity.title ?? '',
      summary: activity.summary ?? '',
      isIssue: activity.isIssue ?? false,
      isConfidential: activity.isConfidential ?? false,

      // Organizations
      leadOrgId: activity.leadOrgId ?? null,
      leadOrgName: activity.leadOrgName ?? null,
      leadOrg: relatedData?.leadOrgName ?? null,

      // Tags
      tags: relatedData?.tags ?? [],

      // Approvals
      significance: activity.significance ?? '',
      activityStatus: relatedData?.activityStatus ?? DEFAULT_STATUS,

      // Scheduling
      dateStatus: relatedData?.dateStatus ?? DEFAULT_STATUS,
      timeStatus: relatedData?.timeStatus ?? DEFAULT_STATUS,
      isAllDay: activity.isAllDay ?? false,
      startDate: formatDate(activity.startDate),
      startTime: formatTime(activity.startTime),
      endDate: formatDate(activity.endDate),
      endTime: formatTime(activity.endTime),
      schedulingNotes: activity.schedulingNotes ?? null,
      strategy: activity.strategy ?? null,

      // Comms
      commsMaterials: relatedData?.commsMaterials ?? [],
      newsReleaseId: activity.newsReleaseId ?? null,
      newsReleaseOriginId: activity.newsReleaseOriginId ?? null,
      newsReleaseDistributionId: activity.newsReleaseDistributionId ?? null,
      translationsRequired: relatedData?.translationsRequired ?? [],

      // Event
      representativesAttending: relatedData?.representativesAttending ?? [],
      venueAddress: relatedData?.venueAddress ?? null,
      eventPlannerLeadId: activity.eventPlannerLeadId ?? null,
      eventLead:
        // Use free-text name if available, otherwise use fetched user name
        activity.eventPlannerLeadName ?? relatedData?.eventLeadName ?? null,
      eventPlannerLeadName: activity.eventPlannerLeadName ?? null,

      // Reports
      executiveSummary: activity.executiveSummary ?? null,
      lookAheadStatus: LOOK_AHEAD_STATUS.includes(
        activity.lookAheadStatus as LookAheadStatus
      )
        ? (activity.lookAheadStatus as LookAheadStatus)
        : (DEFAULT_LOOK_AHEAD_STATUS satisfies LookAheadStatus),
      lookAheadSection: LOOK_AHEAD_SECTION.includes(
        activity.lookAheadSection as LookAheadSection
      )
        ? (activity.lookAheadSection as LookAheadSection)
        : (DEFAULT_LOOK_AHEAD_SECTION satisfies LookAheadSection),

      // Notes and additional fields
      notes: activity.notes ?? null,
      pitchDate: formatDate(activity.pitchDate),
      pitchRequiredStatusId: activity.pitchRequiredStatusId ?? null,
      translationsRequiredStatusId:
        activity.translationsRequiredStatusId ?? null,
      premierRequestedId: activity.premierRequestedId ?? null,
      visibility:
        (activity.visibility as Visibility) ??
        (DEFAULT_VISIBILITY satisfies Visibility),

      // Sharing
      leadMinistryId: activity.leadMinistryId,
      sharedWith: relatedData?.sharedWith ?? [],
      commsContacts: relatedData?.commsContacts ?? [],

      // Computed lookup names
      newsReleaseOrigin: relatedData?.newsReleaseOrigin ?? null,
      newsReleaseDistribution: relatedData?.newsReleaseDistribution ?? null,
      premierRequested: relatedData?.premierRequested ?? null,

      // Report settings
      reportSettings: relatedData?.reportSettings ?? [],

      // Meta
      createdDateTime:
        activity.createdDateTime?.toISOString() ?? new Date().toISOString(),
      createdBy: activity.createdBy ?? 0,
      lastUpdatedDateTime:
        activity.lastUpdatedDateTime?.toISOString() ??
        activity.createdDateTime?.toISOString() ??
        new Date().toISOString(),
      lastUpdatedBy: activity.lastUpdatedBy ?? 0,
    };

    // Runtime validation to ensure response matches schema contract
    try {
      return activityResponseSchema.parse(dto);
    } catch (error) {
      // Log validation errors with context for debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown validation error';
      this.logger.error(
        `Response validation failed for activity ${activity.id}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      // Fail-fast in all environments to prevent invalid responses
      throw new Error(
        `Response validation failed: ${errorMessage}. This indicates a mismatch between the mapping logic and the ActivityResponse schema.`
      );
    }
  }
}
