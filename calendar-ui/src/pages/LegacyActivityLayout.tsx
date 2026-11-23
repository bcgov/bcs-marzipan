import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { fetchLegacyActivity } from '@/api/legacyActivitiesApi';
import {
  ActivityFormStickyHeader,
  ActivityPageHeader,
} from '@/components/activity';
import { StatusMessage } from '@/components/shared';
import { ContentSection } from '@/components/table/ContentSection';
import { LegacyActivityDetailsView } from '@/pages/LegacyActivitiesPage';

export function LegacyActivityLayout() {
  const { id } = useParams();
  const parsedId = Number(id);

  const {
    data: row,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['legacy-activity', parsedId],
    queryFn: () => fetchLegacyActivity(parsedId),
    enabled: Number.isFinite(parsedId),
  });

  if (!Number.isFinite(parsedId)) {
    return (
      <StatusMessage
        title="Legacy data"
        message="Invalid legacy activity id."
        variant="error"
      />
    );
  }

  if (isLoading) {
    return (
      <StatusMessage
        title="Legacy data"
        message="Loading legacy activity..."
        variant="loading"
      />
    );
  }

  if (isError || !row) {
    return (
      <StatusMessage
        title="Legacy data"
        message="Could not load this legacy activity."
        variant="error"
      />
    );
  }

  const legacyId = `${row.sourceSystem}-${row.sourceRecordId}`;

  return (
    <>
      <ActivityFormStickyHeader />
      <ActivityPageHeader
        displayId={legacyId}
        displayIdLabel={legacyId}
        title={row.title ?? '(Untitled legacy record)'}
        categories={[]}
        leadMinistry={row.ministryName}
        activityStatus={row.statusName}
        createdDateTime={row.importedAt}
        createdLabel="Imported"
      />

      <ContentSection>
        <LegacyActivityDetailsView row={row} />
      </ContentSection>
    </>
  );
}
