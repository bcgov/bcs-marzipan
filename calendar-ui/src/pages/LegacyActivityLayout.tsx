import { useParams } from 'react-router-dom';

import {
  ActivityFormStickyHeader,
  ActivityPageHeader,
  LegacyActivityDetails,
} from '@/components/activity';
import { ErrorState, StatusMessage } from '@/components/shared';
import { useLegacyActivity } from '@/hooks/useLegacyActivities';
import { getFriendlyErrorMessage } from '@/lib/error-toast';

const LEGACY_PAGE_TITLE = 'Legacy activity';

export function LegacyActivityLayout(): React.ReactElement {
  const { id } = useParams();
  const legacyId = Number(id);
  const {
    data: activity,
    isLoading,
    error,
    refetch,
  } = useLegacyActivity(legacyId);

  if (!Number.isFinite(legacyId)) {
    return (
      <ErrorState
        title={LEGACY_PAGE_TITLE}
        message="Invalid legacy activity id."
      />
    );
  }

  if (isLoading) {
    return (
      <StatusMessage
        title={LEGACY_PAGE_TITLE}
        message="Loading legacy activity..."
        variant="loading"
      />
    );
  }

  if (error || !activity) {
    return (
      <ErrorState
        title={LEGACY_PAGE_TITLE}
        message={
          error ? getFriendlyErrorMessage(error) : 'Legacy activity not found'
        }
        onRetry={() => void refetch()}
      />
    );
  }

  const displayId = activity.displayId;

  return (
    <>
      <ActivityFormStickyHeader />
      <ActivityPageHeader
        displayId={displayId}
        displayIdLabel={displayId}
        title={activity.title ?? '(Untitled legacy record)'}
        categories={[]}
        leadMinistry={activity.ministryName}
        activityStatus={activity.activityStatus}
        createdDateTime={activity.createdDateTime}
      />
      <LegacyActivityDetails activity={activity} />
    </>
  );
}
