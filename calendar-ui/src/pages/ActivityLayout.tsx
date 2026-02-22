import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';

import type { ActivityResponse } from '@corpcal/shared/schemas';

import { fetchActivity } from '../api/activitiesApi';
import { ErrorState } from '../components/ErrorState';
import { StatusMessage } from '../components/StatusMessage';
import { Button } from '../components/ui/button';
import {
  LOAD_ACTIVITY_NO_ID,
  LOAD_ACTIVITY_TITLE,
} from '../lib/error-messages';
import { getFriendlyErrorMessage } from '../lib/error-toast';
import { createLogger } from '../lib/logger';

const logger = createLogger('ActivityLayout');

export type ActivityLayoutContext = {
  activity: ActivityResponse;
};

export function ActivityLayout(): React.ReactElement {
  const { id } = useParams();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError(LOAD_ACTIVITY_NO_ID);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchActivity(Number(id))
      .then((data) => {
        if (mounted) {
          setActivity(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        logger.error('Failed to load activity', err);
        if (mounted) setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <StatusMessage
          title="Activity"
          message="Loading activity..."
          variant="loading"
        />
      </div>
    );
  }

  if (error || !activity) {
    const handleRetry = () => {
      setError(null);
      setLoading(true);
      if (!id) return;
      fetchActivity(Number(id))
        .then(setActivity)
        .catch((err: unknown) => {
          logger.error('Failed to load activity', err);
          setError(getFriendlyErrorMessage(err));
        })
        .finally(() => setLoading(false));
    };
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ErrorState
          title={LOAD_ACTIVITY_TITLE}
          message={error ?? 'Activity not found'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return <Outlet context={{ activity }} />;
}
