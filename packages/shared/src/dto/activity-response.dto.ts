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
  displayId!: string | null;
  activityStatusId!: string;
  category!: string[];
  title!: string;
  summary!: string | null;
  isIssue!: boolean;
  oicRelated!: boolean;
  isActive!: boolean;
  leadOrg!: string | null;
  jointOrg?: string[] | undefined;
  relatedActivities?: string[] | undefined;
  tags?:
    | Array<{
        id: string;
        text: string;
      }>
    | undefined;
  significance!: string | null;
  pitchStatus!: string;
  pitchComments!: string | null;
  confidential!: boolean;
  schedulingStatus!: string;
  isAllDay!: boolean;
  startDate!: string | null;
  startTime!: string | null;
  endDate!: string | null;
  endTime!: string | null;
  isTimeConfirmed!: boolean;
  isDateConfirmed!: boolean;
  schedulingConsiderations!: string | null;
  commsLead!: string | null;
  commsMaterials?: string[] | undefined;
  newsReleaseId!: string | null;
  translationsRequired?: string[] | undefined;
  eventLeadOrg!: string | null;
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
  eventLead!: string | null;
  eventLeadName!: string | null;
  videographer!: string | null;
  graphics!: string | null;
  notForLookAhead!: boolean;
  lookAheadStatus!: LookAheadStatus | null;
  lookAheadSection!: LookAheadSection | null;
  planningReport!: boolean;
  thirtySixtyNinetyReport!: boolean;
  owner!: string | null;
  sharedWith?: string[] | undefined;
  canEdit?: string[] | undefined;
  canView?: string[] | undefined;
  calendarVisibility!: CalendarVisibility | null;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ActivityResponse = {} as ActivityResponseDto;
