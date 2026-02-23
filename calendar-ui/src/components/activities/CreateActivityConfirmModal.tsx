import { useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import type { FormLookupData } from '../../hooks/useFormLookups';
import { getHistoryFieldLabel } from '../../lib/activity-history-format';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface CreateActivityConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ActivityFormData;
  lookups: FormLookupData;
  dateStatuses?: Array<{ id: number; name: string; label?: string }>;
  timeStatuses?: Array<{ id: number; name: string; label?: string }>;
  onConfirm: (notes?: string) => void;
  isSubmitting: boolean;
}

const PRIMARY_FIELDS: Array<keyof ActivityFormData> = [
  'categoryIds',
  'title',
  'leadMinistryId',
  'summary',
  'commsContactLeadId',
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
  'leadMinistryId',
  'summary',
  'commsContactLeadId',
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
  'eventPlannerLeadId',
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
  timeStatuses?: Array<{ id: number; name: string; label?: string }>
): string {
  if (value === null || value === undefined || value === '') return '(empty)';

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

  if (field === 'commsContactLeadId' && typeof value === 'number') {
    const user = lookups.users.find((u) => String(u.value) === String(value));
    return user?.label || String(value);
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

  if (field === 'eventPlannerLeadId' && typeof value === 'number') {
    const planner = lookups.eventPlanners.find(
      (p) => String(p.value) === String(value)
    );
    return planner?.label || String(value);
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
  onConfirm,
  isSubmitting,
}: CreateActivityConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [showAll, setShowAll] = useState(false);

  const fieldsToShow = showAll ? ALL_DISPLAY_FIELDS : PRIMARY_FIELDS;

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
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
                      timeStatuses
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
