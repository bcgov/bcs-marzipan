import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared/auth';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import { restoreActivity } from '../api/activitiesApi';
import { ActivityBreadcrumb } from '../components/ActivityBreadcrumb';
import { ActivityFormBody } from '../components/ActivityFormBody';
import { ActivityPageHeader } from '../components/ActivityPageHeader';
import { ActivityStatusBanner } from '../components/ActivityStatusBanner';
import { Form } from '../components/ui/form';
import { useAuth } from '../hooks/useAuth';
import { useFormLookups } from '../hooks/useFormLookups';
import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { activityToFormData } from '../lib/activity-form-mapper';
import { showErrorToast } from '../lib/error-toast';
import { createLogger } from '../lib/logger';
import type { ActivityLayoutContext } from './ActivityLayout';

const logger = createLogger('ActivityViewPage');

/**
 * View-only activity page. Clicking/focusing any field navigates to edit (replace) so back goes to list.
 */
export function ActivityViewPage(): React.ReactElement {
  const { activity, refreshActivity } =
    useOutletContext<ActivityLayoutContext>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.ACTIVITIES.EDIT);
  const lookups = useFormLookups();
  const hasNavigatedRef = useRef(false);
  const readyRef = useRef(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const isAdminOrSysAdmin =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
  const isCommsContact =
    activity.commsContacts?.some((c) => c.userId === user?.id) ?? false;
  const activityStatusName = activity.activityStatus ?? '';
  const isBlockedStatus =
    activityStatusName === 'delete_requested' ||
    activityStatusName === 'deleted';
  const canRestore = isCommsContact || isAdminOrSysAdmin;

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreActivity(activity.id);
      await refreshActivity();
      toast.success('Activity restored');
    } catch (err) {
      logger.error('Failed to restore activity', err);
      showErrorToast(err);
    } finally {
      setIsRestoring(false);
    }
  };

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange',
    defaultValues: getDefaultFormValues(),
  });

  useEffect(() => {
    if (
      lookups.governmentRepresentatives?.length &&
      lookups.categories?.length
    ) {
      readyRef.current = false;
      form.reset(activityToFormData(activity, lookups));
      requestAnimationFrame(() => {
        readyRef.current = true;
      });
    }
  }, [activity, lookups, form]);

  const handleEnterEdit = () => {
    if (!canEdit || !readyRef.current || hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    void navigate('edit', { replace: true });
  };

  const displayId = activity.displayId ?? `ACT-${activity.id}`;
  const categories = activity.category ?? [];

  return (
    <>
      <ActivityBreadcrumb currentLabel={displayId} />
      <ActivityPageHeader
        displayId={displayId}
        title={activity.title ?? ''}
        categories={categories}
        leadOrg={activity.leadOrg ?? null}
        activityStatus={activity.activityStatus ?? null}
        lastUpdatedDateTime={activity.lastUpdatedDateTime ?? null}
        createdDateTime={activity.createdDateTime ?? null}
        onHistoryClick={undefined}
      />
      {isBlockedStatus && (
        <ActivityStatusBanner
          status={activityStatusName}
          canRestore={canRestore}
          onRestore={handleRestore}
          isRestoring={isRestoring}
        />
      )}
      <FormProvider {...form}>
        <Form {...form}>
          <form
            className="cursor-pointer"
            onSubmit={(e) => e.preventDefault()}
            onFocus={() => handleEnterEdit()}
            onClick={() => handleEnterEdit()}
          >
            <ActivityFormBody form={form} lookups={lookups} readOnly={true} />
          </form>
        </Form>
      </FormProvider>
    </>
  );
}
