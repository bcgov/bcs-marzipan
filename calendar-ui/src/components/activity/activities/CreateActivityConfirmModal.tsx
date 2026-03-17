import { useState } from 'react';

import type { TeamListItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormLookupData } from '@/hooks/useFormLookups';
import { getHistoryFieldLabel } from '@/lib/activity-history-format';

interface CreateActivityConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ActivityFormData;
  lookups: FormLookupData;
  dateStatuses?: Array<{ id: number; name: string; label?: string }>;
  timeStatuses?: Array<{ id: number; name: string; label?: string }>;
  /** When provided, used to resolve leadTeamId to team name in confirm summary. */
  leadTeamOptions?: TeamListItem[];
  onConfirm: (notes?: string, markAsReviewed?: boolean) => void;
  isSubmitting: boolean;
  /** When true, show "Mark as reviewed" checkbox (admin/sysAdmin only). */
  showMarkAsReviewed?: boolean;
}

const PRIMARY_FIELDS: Array<keyof ActivityFormData> = [
  'categoryIds',
  'title',
  'leadTeamId',
  'summary',
  'commsContacts',
  'startDate',
  'endDate',
  'dateStatusId',
  'startTime',
  'endTime',
  'timeStatusId',
];

const ALL_DISPLAY_FIELDS: Array<keyof ActivityFormData> = [
  'categoryIds',
  'title',
  'leadTeamId',
  'summary',
  'commsContacts',
  'startDate',
  'endDate',
  'dateStatusId',
  'startTime',
  'endTime',
  'timeStatusId',
  'significance',
  'schedulingNotes',
  'strategy',
  'isIssue',
  'isAllDay',
  'isConfidential',
  'visibility',
  'pitchDate',
  'notes',
  'executiveSummary',
  'leadOrgId',
  'eventPlanners',
  'pitchRequiredStatusId',
  'translationsRequiredStatusId',
  'lookAheadStatus',
  'lookAheadSection',
  'venueAddress',
  'representatives',
];

function resolveDisplayValue(
  field: keyof ActivityFormData,
  value: unknown,
  lookups: FormLookupData,
  dateStatuses?: Array<{ id: number; name: string; label?: string }>,
  timeStatuses?: Array<{ id: number; name: string; label?: string }>,
  leadTeamOptions?: TeamListItem[]
): string {
  if (value === null || value === undefined || value === '') return '(empty)';

  if (field === 'leadTeamId' && typeof value === 'number' && leadTeamOptions) {
    const team = leadTeamOptions.find((t) => t.id === value);
    if (team) {
      return team.ministryName
        ? `${team.displayName || team.name} (${team.ministryName})`
        : team.displayName || team.name;
    }
  }

  if (field === 'categoryIds' && Array.isArray(value)) {
    if (value.length === 0) return '(none)';
    return value
      .map((id: number) => {
        const cat = lookups.categories.find((c) => c.id === id);
        return cat?.displayName || cat?.name || String(id);
      })
      .join(', ');
  }

  if (field === 'leadMinistryId' && typeof value === 'number') {
    const ministry = lookups.ministries.find((m) => m.id === value);
    return ministry?.displayName || ministry?.name || String(value);
  }

  if (field === 'commsContacts' && Array.isArray(value)) {
    const contacts = value as Array<{ userId?: number; isLead?: boolean }>;
    if (contacts.length === 0) return '(none)';
    return contacts
      .map((c) => {
        const user = lookups.users.find(
          (u) => c.userId != null && String(u.value) === String(c.userId)
        );
        const name = user?.label ?? String(c.userId ?? '');
        return c.isLead ? `${name} (Lead)` : name;
      })
      .join(', ');
  }

  if (field === 'dateStatusId' && typeof value === 'number' && dateStatuses) {
    const status = dateStatuses.find((s) => s.id === value);
    return status?.label || status?.name || String(value);
  }

  if (field === 'timeStatusId' && typeof value === 'number' && timeStatuses) {
    const status = timeStatuses.find((s) => s.id === value);
    return status?.label || status?.name || String(value);
  }

  if (field === 'leadOrgId' && typeof value === 'number') {
    const org = lookups.organizations.find((o) => o.value === value);
    return org?.label || String(value);
  }

  if (field === 'eventPlanners' && Array.isArray(value)) {
    if (value.length === 0) return '(none)';
    const items = value as Array<{
      eventPlannerLeadId?: number;
      eventPlannerLeadName?: string;
    }>;
    return items
      .map((p) => {
        if (p.eventPlannerLeadId != null) {
          const planner = lookups.eventPlanners.find(
            (ep) => String(ep.value) === String(p.eventPlannerLeadId)
          );
          return planner?.label ?? String(p.eventPlannerLeadId);
        }
        return p.eventPlannerLeadName ?? '(unknown)';
      })
      .join(', ');
  }

  if (field === 'pitchRequiredStatusId' && typeof value === 'number') {
    const status = lookups.pitchStatuses.find((s) => s.id === value);
    return status?.displayName || status?.name || String(value);
  }

  if (field === 'activityStatusId' && typeof value === 'number') {
    const status = lookups.activityStatuses.find((s) => s.id === value);
    return status?.displayName || status?.name || String(value);
  }

  if (field === 'venueAddress' && typeof value === 'object') {
    const addr = value as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof addr.venueName === 'string' && addr.venueName)
      parts.push(addr.venueName);
    if (typeof addr.street === 'string' && addr.street) parts.push(addr.street);
    if (typeof addr.city === 'string' && addr.city) parts.push(addr.city);
    if (typeof addr.provinceOrState === 'string' && addr.provinceOrState)
      parts.push(addr.provinceOrState);
    if (typeof addr.country === 'string' && addr.country)
      parts.push(addr.country);
    return parts.length > 0 ? parts.join(', ') : '(empty)';
  }

  if (field === 'representatives' && Array.isArray(value)) {
    if (value.length === 0) return '(none)';
    return value
      .map(
        (r: { representativeId?: number; representativeName?: string }) =>
          r.representativeName || `Rep ${r.representativeId}`
      )
      .join(', ');
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value))
    return value.length > 0 ? value.join(', ') : '(none)';

  if (typeof value === 'object') return '(object)';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '(empty)';
}

export function CreateActivityConfirmModal({
  open,
  onOpenChange,
  formData,
  lookups,
  dateStatuses,
  timeStatuses,
  leadTeamOptions,
  onConfirm,
  isSubmitting,
  showMarkAsReviewed = false,
}: CreateActivityConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [markAsReviewed, setMarkAsReviewed] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fieldsToShow = showAll ? ALL_DISPLAY_FIELDS : PRIMARY_FIELDS;

  const handleConfirm = () => {
    onConfirm(
      notes.trim() || undefined,
      showMarkAsReviewed ? markAsReviewed : undefined
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setMarkAsReviewed(true);
      setShowAll(false);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm new activity</DialogTitle>
          <DialogDescription>
            Review the activity details before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-2 pr-1">
            {fieldsToShow.map((field) => {
              const value = formData[field];
              if (value === undefined || value === null || value === '')
                return null;
              if (Array.isArray(value) && value.length === 0) return null;

              return (
                <div key={field} className="flex gap-2 text-sm">
                  <span className="min-w-[120px] shrink-0 font-medium">
                    {getHistoryFieldLabel(field)}:
                  </span>
                  <span className="text-muted-foreground">
                    {resolveDisplayValue(
                      field,
                      value,
                      lookups,
                      dateStatuses,
                      timeStatuses,
                      leadTeamOptions
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {!showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Show more
            </button>
          )}
          {showAll && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="mt-3 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Show less
            </button>
          )}

          {showMarkAsReviewed && (
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                id="create-confirm-mark-reviewed"
                checked={markAsReviewed}
                onCheckedChange={(checked) =>
                  setMarkAsReviewed(checked === true)
                }
              />
              <Label
                htmlFor="create-confirm-mark-reviewed"
                className="cursor-pointer text-sm font-normal"
              >
                Mark as reviewed
              </Label>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <Label htmlFor="create-confirm-notes">Add a note (optional)</Label>
            <Textarea
              id="create-confirm-notes"
              placeholder="Give additional context about your changes."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Go back
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
