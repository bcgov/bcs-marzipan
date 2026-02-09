"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityResponseDto = void 0;
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
class ActivityResponseDto {
    id;
    displayId;
    activityStatusId;
    category;
    title;
    summary;
    isIssue;
    oicRelated;
    isActive;
    leadOrg;
    jointOrg;
    relatedActivities;
    tags;
    significance;
    pitchStatus;
    pitchComments;
    confidential;
    schedulingStatus;
    isAllDay;
    startDate;
    startTime;
    endDate;
    endTime;
    isTimeConfirmed;
    isDateConfirmed;
    schedulingConsiderations;
    commsLead;
    commsMaterials;
    newsReleaseId;
    translationsRequired;
    eventLeadOrg;
    jointEventOrg;
    representativesAttending;
    venueAddress;
    eventLead;
    eventLeadName;
    videographer;
    graphics;
    notForLookAhead;
    lookAheadStatus;
    lookAheadSection;
    planningReport;
    thirtySixtyNinetyReport;
    owner;
    sharedWith;
    canEdit;
    canView;
    calendarVisibility;
    createdDateTime;
    createdBy;
    lastUpdatedDateTime;
    lastUpdatedBy;
    /**
     * Factory method to create an ActivityResponseDto from an ActivityResponse object
     *
     * @param data - The ActivityResponse data to create the DTO from
     * @returns A new ActivityResponseDto instance
     */
    static from(data) {
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
    static fromPlainObject(data) {
        return ActivityResponseDto.from(data);
    }
}
exports.ActivityResponseDto = ActivityResponseDto;
// Compile-time check: ensure ActivityResponseDto implements ActivityResponse correctly
// If this doesn't compile, the class definition doesn't match the type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck = {};
