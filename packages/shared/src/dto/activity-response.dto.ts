import type { ActivityResponse } from '../schemas/activity-response.schema';
import type {
  AttendingStatus,
  LookAheadStatus,
  LookAheadSection,
  CalendarVisibility,
} from '../constants/activity-enums';

/**
 * ActivityResponseDto
 *
 * DTO class for Activity API responses.
 * Implements the ActivityResponse type to provide better IDE support
 * and explicit contracts.
 *
 * This class ensures compile-time type safety that the DTO matches
 * the ActivityResponse schema contract.
 *
 * Note: Properties use definite assignment assertions (!) because they are
 * populated via Object.assign in the factory methods, not in a constructor.
 */
export class ActivityResponseDto implements ActivityResponse {
  id!: number;
  displayId!: string;
  activityStatusId!: string;
  pitchStatusId!: string;
  dateStatusId!: string;
  timeStatusId!: string;
  venueStatusId!: string | null;
  category!: string[];
  title!: string;
  summary!: string;
  isIssue!: boolean;
  isActive!: boolean;
  leadOrgId!: string | null;
  leadOrgName!: string | null;
  leadOrg!: string | null; // Backward compatibility
  jointOrg?: string[] | undefined;
  relatedActivities?: string[] | undefined;
  tags?:
    | Array<{
        id: string;
        text: string;
      }>
    | undefined;
  significance!: string;
  pitchStatus!: string;
  dateStatus!: string;
  timeStatus!: string;
  venueStatus!: string | null;
  pitchComments!: string | null;
  isAllDay!: boolean;
  startDate!: string | null;
  startTime!: string | null;
  endDate!: string | null;
  endTime!: string | null;
  schedulingConsiderations!: string;
  commsMaterials?: string[] | undefined;
  newsReleaseId!: string | null;
  newsReleaseOriginId!: string | null;
  newsReleaseOriginName!: string | null;
  translationsRequired?: string[] | undefined;
  eventLeadOrgId!: string | null;
  eventLeadOrgName!: string | null;
  eventLeadOrg!: string | null; // Backward compatibility
  jointEventOrg?: string[] | undefined;
  representativesAttending?:
    | Array<{
        representative: string;
        attendingStatus: AttendingStatus;
      }>
    | undefined;
  venueAddress!: {
    street: string;
    city: string;
    provinceOrState: string;
    country: string;
  } | null;
  venue!: string | null;
  eventLeadId!: string | null;
  eventLead!: string | null; // Computed from eventLeadId
  eventLeadName!: string | null;
  graphicsUserId!: string | null;
  graphicsUser!: string | null; // Computed from graphicsUserId
  notForLookAhead!: boolean;
  notForThirtySixtyNinety!: boolean;
  lookAheadStatus!: LookAheadStatus | null;
  lookAheadSection!: LookAheadSection | null;
  ownerId!: string;
  owner!: string; // Computed from ownerId
  additionalOwners?: string[] | undefined;
  ministryOwnerId!: string | null;
  sharedWith?: string[] | undefined;
  canEdit?: string[] | undefined;
  canView?: string[] | undefined;
  calendarVisibility!: CalendarVisibility;
  createdDateTime!: string;
  createdBy!: string;
  lastUpdatedDateTime!: string;
  lastUpdatedBy!: string;

  /**
   * Factory method to create an ActivityResponseDto from an ActivityResponse object
   *
   * @param data - The ActivityResponse data to create the DTO from
   * @returns A new ActivityResponseDto instance
   */
  static from(data: ActivityResponse): ActivityResponseDto {
    const dto = new ActivityResponseDto();
    Object.assign(dto, data);
    return dto;
  }

  /**
   * Create an ActivityResponseDto from a plain object
   * Useful for deserializing from JSON
   *
   * @param data - Plain object that should match ActivityResponse
   * @returns A new ActivityResponseDto instance
   */
  static fromPlainObject(data: unknown): ActivityResponseDto {
    return ActivityResponseDto.from(data as ActivityResponse);
  }
}

// Compile-time check: ensure ActivityResponseDto implements ActivityResponse correctly
// If this doesn't compile, the class definition doesn't match the type
const _typeCheck: ActivityResponse = {} as ActivityResponseDto;

// Silence unused variable warnings
void _typeCheck;
