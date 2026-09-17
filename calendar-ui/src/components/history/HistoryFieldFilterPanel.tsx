import { useCallback, useMemo, useState } from 'react';

import {
  buildActivityHistoryFieldFilterSections,
  getActivityHistoryFieldLabel,
  type FieldScopeUser,
} from '@corpcal/shared/utils';
import {
  FilterSearchableList,
  type FilterSearchableListSection,
} from '@/components/activity/ActivityTable/FilterSearchableList';

export type HistoryFieldFilterPanelProps = {
  viewer: FieldScopeUser;
  selectedFields: string[];
  onSelectedFieldsChange: (fields: string[]) => void;
};

function buildFieldFilterSections(
  viewer: FieldScopeUser
): FilterSearchableListSection[] {
  return buildActivityHistoryFieldFilterSections(viewer).map((section) => ({
    heading: section.heading,
    options: section.fieldKeys.map((fieldKey) => ({
      value: fieldKey,
      label: getActivityHistoryFieldLabel(fieldKey),
    })),
  }));
}

export function HistoryFieldFilterPanel({
  viewer,
  selectedFields,
  onSelectedFieldsChange,
}: HistoryFieldFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const sections = useMemo(() => buildFieldFilterSections(viewer), [viewer]);

  const handleToggle = useCallback(
    (fieldKey: string) => {
      if (selectedFields.includes(fieldKey)) {
        onSelectedFieldsChange(
          selectedFields.filter((field) => field !== fieldKey)
        );
        return;
      }
      onSelectedFieldsChange([...selectedFields, fieldKey]);
    },
    [onSelectedFieldsChange, selectedFields]
  );

  const handleClear = useCallback(() => {
    onSelectedFieldsChange([]);
  }, [onSelectedFieldsChange]);

  return (
    <FilterSearchableList
      sections={sections}
      selectedValues={selectedFields}
      onToggleValue={handleToggle}
      searchPlaceholder="Search fields..."
      searchAriaLabel="Search history fields"
      emptyMessage="No fields found"
      showClearButton
      onClear={handleClear}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    />
  );
}
