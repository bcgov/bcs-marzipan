import type { HistoryAudience } from '@corpcal/shared';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { HistoryAudienceSelector } from './HistoryAudienceSelector';

type ActivityHistorySaveFieldsProps = {
  permissions: string[];
  historyAudience: HistoryAudience;
  onHistoryAudienceChange: (value: HistoryAudience) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  idPrefix: string;
  notesPlaceholder?: string;
  notesMaxLength?: number;
};

/** Shared history audience + optional note fields for activity save confirm flows. */
export function ActivityHistorySaveFields({
  permissions,
  historyAudience,
  onHistoryAudienceChange,
  notes,
  onNotesChange,
  idPrefix,
  notesPlaceholder = 'Give additional context about your changes.',
  notesMaxLength = 1000,
}: ActivityHistorySaveFieldsProps) {
  return (
    <div className="space-y-4">
      <HistoryAudienceSelector
        permissions={permissions}
        value={historyAudience}
        onChange={onHistoryAudienceChange}
        id={`${idPrefix}-history-audience`}
      />
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>Add a note (optional)</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          placeholder={notesPlaceholder}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          maxLength={notesMaxLength}
        />
      </div>
    </div>
  );
}
