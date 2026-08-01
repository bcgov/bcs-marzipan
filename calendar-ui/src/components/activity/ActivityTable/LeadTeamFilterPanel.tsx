import { useCallback, useMemo, useState } from 'react';

import {
  FilterSearchableList,
  type FilterSearchableListOption,
  type FilterSearchableListSection,
} from './FilterSearchableList';

export interface LeadTeamFilterOption extends FilterSearchableListOption {
  ministryId: number | null;
}

export interface LeadTeamFilterPanelProps {
  teamOptions: LeadTeamFilterOption[];
  selectedTeamIds: number[];
  onSelectedTeamIdsChange: (ids: number[]) => void;
}

const MINISTRY_TEAMS_HEADING = 'Ministry teams';
const OTHER_TEAMS_HEADING = 'Other teams';

function buildLeadTeamSections(
  options: LeadTeamFilterOption[]
): FilterSearchableListSection[] {
  const ministryTeams = options.filter((t) => t.ministryId != null);
  const otherTeams = options.filter((t) => t.ministryId == null);
  const sections: FilterSearchableListSection[] = [];
  if (ministryTeams.length > 0) {
    sections.push({ heading: MINISTRY_TEAMS_HEADING, options: ministryTeams });
  }
  if (otherTeams.length > 0) {
    sections.push({ heading: OTHER_TEAMS_HEADING, options: otherTeams });
  }
  return sections;
}

/**
 * Lead team multi-select: ministry-associated teams first, then teams without a ministry.
 */
export function LeadTeamFilterPanel({
  teamOptions,
  selectedTeamIds,
  onSelectedTeamIdsChange,
}: LeadTeamFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const sections = useMemo(
    () => buildLeadTeamSections(teamOptions),
    [teamOptions]
  );

  const handleToggle = useCallback(
    (id: number) => {
      if (selectedTeamIds.includes(id)) {
        onSelectedTeamIdsChange(selectedTeamIds.filter((x) => x !== id));
      } else {
        onSelectedTeamIdsChange([...selectedTeamIds, id]);
      }
    },
    [selectedTeamIds, onSelectedTeamIdsChange]
  );

  const handleClear = useCallback(() => {
    onSelectedTeamIdsChange([]);
  }, [onSelectedTeamIdsChange]);

  return (
    <FilterSearchableList
      sections={sections}
      selectedIds={selectedTeamIds}
      onToggle={handleToggle}
      searchPlaceholder="Search teams..."
      searchAriaLabel="Search lead teams"
      emptyMessage="No teams found"
      showClearButton
      onClear={handleClear}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    />
  );
}
