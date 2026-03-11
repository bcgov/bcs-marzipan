import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared/auth';
import type { ActivityResponse } from '@corpcal/shared/schemas';

import { fetchActivity } from '../api/activitiesApi';
import { ErrorState } from '../components/ErrorState';
import { StatusMessage } from '../components/StatusMessage';
import { useAuth } from '../hooks/useAuth';
import {
  LOAD_ACTIVITY_NO_ID,
  LOAD_ACTIVITY_TITLE,
} from '../lib/error-messages';
import { getFriendlyErrorMessage } from '../lib/error-toast';
import { createLogger } from '../lib/logger';
import { ActivityPage } from './ActivityPage';

const logger = createLogger('ActivityLayout');

export type ActivityLayoutContext = {
  activity: ActivityResponse;
  /** Refetch activity (e.g. after restore). */
  refreshActivity: () => Promise<void>;
};

export function ActivityLayout(): React.ReactElement {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditRoute = location.pathname.endsWith('/edit');
  const canAccessEdit = hasPermission(PERMISSIONS.ACTIVITIES.EDIT);
  const redirectToView = isEditRoute && !canAccessEdit;

  // Redirect users without EDIT permission away from edit route before loading activity
  useEffect(() => {
    if (!id || !redirectToView) return;
    void navigate(`/activity/${id}`, { replace: true });
  }, [id, redirectToView, navigate]);

  const refreshActivity = useCallback(async () => {
    if (!id) return;
    const data = await fetchActivity(Number(id));
    setActivity(data);
    setError(null);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError(LOAD_ACTIVITY_NO_ID);
      setLoading(false);
      return;
    }
    if (redirectToView) {
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
  }, [id, redirectToView]);

  if (loading) {
    return (
      <StatusMessage
        title="Activity"
        message="Loading activity..."
        variant="loading"
      />
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
      <ErrorState
        title={LOAD_ACTIVITY_TITLE}
        message={error ?? 'Activity not found'}
        onRetry={handleRetry}
      />
    );
  }

  return <ActivityPage activity={activity} refreshActivity={refreshActivity} />;
}
