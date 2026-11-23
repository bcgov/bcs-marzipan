import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { fetchLegacyActivity } from '@/api/legacyActivitiesApi';
import { PageHeader } from '@/components/layout';
import { StatusMessage } from '@/components/shared';
import { ContentSection } from '@/components/table/ContentSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LegacyActivityDetailsView } from '@/pages/LegacyActivitiesPage';

function toLegacyListPath(): string {
  return '/';
}

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

  return (
    <>
      <PageHeader
        title="Legacy Data"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Read-only</Badge>
            <Button asChild type="button" variant="outline">
              <Link to={toLegacyListPath()}>
                <ArrowLeft className="h-4 w-4" />
                Back to activities
              </Link>
            </Button>
          </div>
        }
      />

      <ContentSection>
        <LegacyActivityDetailsView row={row} />
      </ContentSection>
    </>
  );
}
