import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';

import {
  ACTIVITY_BRIEF_RICH_TEXT_MAX_LENGTH,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextField } from '@/components/ui/rich-text-field';
import {
  lookAheadSectionNoneOption,
  lookAheadStatusOptions,
} from '@/constants/form-options';
import {
  rowsToSectionOptions,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import {
  lookAheadSectionFormValue,
  lookAheadStatusFormValue,
  optionalRadioDisplayValue,
} from '@/lib/activity-form-coerce-value';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';
import { ActivityFormSection } from './ActivityFormSection';

export const ActivityLookAheadSection: React.FC = () => {
  const { canViewFieldScope } = useActivityEdit();
  const canViewLookAhead = canViewFieldScope?.('lookAhead') ?? false;
  const lookAheadScope = useActivityFieldScopeControl('lookAhead');
  const form = useFormContext<ActivityFormData>();
  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();
  const lookAheadSectionOptions = useMemo(
    () => rowsToSectionOptions(lookAheadSectionRows),
    [lookAheadSectionRows]
  );

  if (!canViewLookAhead) {
    return null;
  }

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.lookAhead}>
      <FormField
        control={form.control}
        name="executiveSummary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="executiveSummary"
                  ariaLabel="About executive summary"
                />
              </>
            </FormLabel>
            <ActivityFieldScopePermissionTooltip scope="lookAhead">
              <FormControl>
                <RichTextField
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(json) =>
                    setActivityFormFieldValue(form, field.name, json)
                  }
                  onBlur={field.onBlur}
                  maxLength={ACTIVITY_BRIEF_RICH_TEXT_MAX_LENGTH}
                  readOnly={lookAheadScope.readOnly}
                  disabled={lookAheadScope.fieldScopeDisabled}
                  data-field={field.name}
                />
              </FormControl>
            </ActivityFieldScopePermissionTooltip>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lookAheadStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="lookAheadStatus"
                  ariaLabel="About Look Ahead status"
                />
              </>
            </FormLabel>
            <ActivityFieldScopePermissionTooltip scope="lookAhead">
              <FormControl data-field={field.name}>
                <RadioGroup
                  readOnly={lookAheadScope.readOnly}
                  disabled={lookAheadScope.fieldScopeDisabled}
                  onValueChange={(value) =>
                    setActivityFormFieldValue(
                      form,
                      field.name,
                      lookAheadStatusFormValue(value)
                    )
                  }
                  value={optionalRadioDisplayValue(field.value)}
                  className="flex flex-row space-x-4"
                >
                  {lookAheadStatusOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`status-${option.value}`}
                      />
                      <Label
                        htmlFor={`status-${option.value}`}
                        className="cursor-pointer font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            </ActivityFieldScopePermissionTooltip>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lookAheadSection"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="lookAheadSection"
                  ariaLabel="About Look Ahead section"
                />
              </>
            </FormLabel>
            <ActivityFieldScopePermissionTooltip scope="lookAhead">
              <FormControl data-field={field.name}>
                <RadioGroup
                  readOnly={lookAheadScope.readOnly}
                  disabled={lookAheadScope.fieldScopeDisabled}
                  onValueChange={(value) =>
                    setActivityFormFieldValue(
                      form,
                      field.name,
                      lookAheadSectionFormValue(value)
                    )
                  }
                  value={optionalRadioDisplayValue(field.value)}
                  className="flex flex-row flex-wrap gap-x-4 gap-y-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={lookAheadSectionNoneOption.value}
                      id="lookAhead-section-none"
                    />
                    <Label
                      htmlFor="lookAhead-section-none"
                      className="cursor-pointer font-normal"
                    >
                      {lookAheadSectionNoneOption.label}
                    </Label>
                  </div>
                  {lookAheadSectionOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`lookAhead-section-${option.value}`}
                      />
                      <Label
                        htmlFor={`lookAhead-section-${option.value}`}
                        className="cursor-pointer font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            </ActivityFieldScopePermissionTooltip>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
