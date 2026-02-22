import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useRef } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import { ActivityBreadcrumb } from '../components/ActivityBreadcrumb';
import { ActivityFormBody } from '../components/ActivityFormBody';
import { ActivityPageHeader } from '../components/ActivityPageHeader';
import { Form } from '../components/ui/form';
import { useAuth } from '../hooks/useAuth';
import { useFormLookups } from '../hooks/useFormLookups';
import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { activityToFormData } from '../lib/activity-form-mapper';
import type { ActivityLayoutContext } from './ActivityLayout';

/**
 * View-only activity page. Clicking/focusing any field navigates to edit (replace) so back goes to list.
 */
export function ActivityViewPage(): React.ReactElement {
  const { activity } = useOutletContext<ActivityLayoutContext>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.ACTIVITIES.EDIT);
  const lookups = useFormLookups();
  const hasNavigatedRef = useRef(false);
  const readyRef = useRef(false);

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
      <FormProvider {...form}>
        <Form {...form}>
          <form
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
