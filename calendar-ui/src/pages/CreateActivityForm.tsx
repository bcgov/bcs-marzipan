import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary } from 'react-error-boundary';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import React, { useEffect, useRef, useState, type FC } from 'react';

import { PERMISSIONS } from '@corpcal/shared/auth';
import {
  createActivityRequestSchema,
  type ActivityFormData,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
import { ActivityFormBody } from '@/components/activity';
import { CreateActivityConfirmModal } from '@/components/activity/activities/CreateActivityConfirmModal';
import { PageHeader } from '@/components/layout';
import {
  ActivityBreadcrumb,
  AutosaveIndicator,
  FormErrorFallback,
  StatusMessage,
} from '@/components/shared';

import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ResumeDialog,
} from '../components/ui/resumeDraftDialog';
import { useAuth } from '../hooks/useAuth';
import { useAutoSave } from '../hooks/useAutoSave';
import { useCreateActivity } from '../hooks/useCalendar';
import { useFormLookups } from '../hooks/useFormLookups';
import { useLeadTeamOptions } from '../hooks/useLeadTeamOptions';
import { useDateStatuses, useTimeStatuses } from '../hooks/useLookups';
import {
  DEFAULT_FORM_VALUES,
  getDefaultFormValues,
} from '../lib/activity-form-defaults';
import { getActivityFieldLabel } from '../lib/activity-form-labels';
import { buildPayloadForCreate } from '../lib/activity-form-payload';
import {
  ACCESS_DENIED_CREATE_ACTIVITY_MESSAGE,
  ACCESS_DENIED_TITLE,
} from '../lib/error-messages';
import { showErrorToast } from '../lib/error-toast';
import { getMissingRequiredFields } from '../lib/form-utils';
import { createLogger } from '../lib/logger';

// Key used to store draft dialog session state in sessionStorage
const DRAFT_DIALOG_SESSION_KEY = 'create-activity-draft-dialog';

const logger = createLogger('CreateActivityForm');

export const CreateActivityForm: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissingFieldsPopover, setShowMissingFieldsPopover] =
    useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validatedData, setValidatedData] = useState<ActivityFormData | null>(
    null
  );
  const draftCheckedRef = useRef(false);

  const createMutation = useCreateActivity();
  const {
    hasPermission,
    isLoading: isAuthLoading,
    isAuthenticated,
    user,
  } = useAuth();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);
  const canReviewActivities = hasPermission(PERMISSIONS.ACTIVITIES.REVIEW);

  // Fetch date and time statuses
  const { data: dateStatuses } = useDateStatuses();
  const { data: timeStatuses } = useTimeStatuses();

  // Fetch all lookup data
  const lookups = useFormLookups();
  const {
    data: leadTeamOptions = [],
    isError: leadTeamOptionsError,
    refetch: refetchLeadTeamOptions,
  } = useLeadTeamOptions(canCreateActivity);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange', // Validate on change to enable real-time validation
    defaultValues: {
      ...getDefaultFormValues(),
    },
  });

  // Set default date and time statuses to "unknown" when they're loaded
  useEffect(() => {
    if (dateStatuses && !form.getValues('dateStatusId')) {
      const unknownStatus = dateStatuses.find((s) => s.name === 'unknown');
      if (unknownStatus) {
        form.setValue('dateStatusId', unknownStatus.id);
      }
    }
  }, [dateStatuses, form]);

  useEffect(() => {
    if (timeStatuses && !form.getValues('timeStatusId')) {
      const unknownStatus = timeStatuses.find((s) => s.name === 'unknown');
      if (unknownStatus) {
        form.setValue('timeStatusId', unknownStatus.id);
      }
    }
  }, [timeStatuses, form]);

  // Default lead team to user's first team when options load (only if form has no leadTeamId yet).
  // One-way sync: also set Lead Org from the team's ministry (first org with matching ministryId, or leave unfilled).
  useEffect(() => {
    if (leadTeamOptions.length === 0) return;
    const currentLeadTeamId = form.getValues('leadTeamId');
    if (currentLeadTeamId != null && currentLeadTeamId !== 0) return;
    const firstUserTeamId = user?.teamIds?.[0];
    const defaultTeam =
      (firstUserTeamId != null &&
        leadTeamOptions.find((t) => t.id === firstUserTeamId)) ||
      leadTeamOptions[0];
    if (defaultTeam) {
      form.setValue('leadTeamId', defaultTeam.id);
      form.setValue('leadMinistryId', defaultTeam.ministryId ?? undefined);
      const ministryId = defaultTeam.ministryId ?? null;
      const orgForMinistry = lookups.organizations.find(
        (o) => o.ministryId != null && o.ministryId === ministryId
      );
      if (orgForMinistry) {
        form.setValue('leadOrgId', orgForMinistry.value);
        form.setValue('leadOrgName', null);
      }
      // If no org has this ministryId, leave Lead Org unfilled (defaults already null)
    }
  }, [leadTeamOptions, user?.teamIds, lookups.organizations, form]);

  // When organizations load after default team was set, populate Lead Org from that team's ministry (one-time sync).
  useEffect(() => {
    if (lookups.organizations.length === 0 || leadTeamOptions.length === 0)
      return;
    const leadTeamId = form.getValues('leadTeamId');
    const leadOrgId = form.getValues('leadOrgId');
    const leadOrgName = form.getValues('leadOrgName');
    if (
      leadTeamId == null ||
      leadTeamId === 0 ||
      (leadOrgId != null && leadOrgId !== 0) ||
      (leadOrgName != null && leadOrgName !== '')
    )
      return;
    const team = leadTeamOptions.find((t) => t.id === leadTeamId);
    if (!team?.ministryId) return;
    const orgForMinistry = lookups.organizations.find(
      (o) => o.ministryId != null && o.ministryId === team.ministryId
    );
    if (orgForMinistry) {
      form.setValue('leadOrgId', orgForMinistry.value);
      form.setValue('leadOrgName', null);
    }
  }, [lookups.organizations, leadTeamOptions, form]);

  // Get form values for autosave - use subscription pattern to avoid infinite loops
  const [formValues, setFormValues] = useState<Partial<ActivityFormData>>(() =>
    form.getValues()
  );
  const previousValuesRef = useRef<string>('');

  useEffect(() => {
    // Subscribe to form changes and only update state when values actually change
    const subscription = form.watch((values) => {
      const newValues = values as Partial<ActivityFormData>;
      const newValuesStr = JSON.stringify(newValues);

      // Only update if values actually changed
      if (newValuesStr !== previousValuesRef.current) {
        previousValuesRef.current = newValuesStr;
        setFormValues(newValues);
      }
    });

    // Initialize previous values ref
    previousValuesRef.current = JSON.stringify(form.getValues());

    return () => subscription.unsubscribe();
  }, [form]);

  // Autosave integration: userId comes from auth context inside useAutoSave
  const initialDraftExistsRef = useRef(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  const {
    existingDraft,
    isDraftLoading,
    isSaving,
    lastSaved,
    deleteDraft,
    resetInitialFormData,
  } = useAutoSave(
    'activity',
    formValues,
    undefined,
    {
      debounceMs: 3000, // Save 3 seconds after user stops typing
      // enabled: !isSubmitting, // Disable during submission

      // Temporarily disabling while polishing other form features
      enabled: false,
      onSaveError: (err) => {
        logger.error('Draft save failed', err);
        showErrorToast(err, 'Draft could not be saved.');
      },
    },
    DEFAULT_FORM_VALUES
  );

  // On first load, record if a draft existed at mount, and only ever show dialog if it did
  const didCheckInitialDraft = useRef(false);
  useEffect(() => {
    if (isDraftLoading || didCheckInitialDraft.current) return;
    didCheckInitialDraft.current = true;
    if (
      existingDraft?.draftData &&
      Object.keys(existingDraft.draftData).length > 0
    ) {
      initialDraftExistsRef.current = true;
      setShowDraftDialog(true);
    } else {
      initialDraftExistsRef.current = false;
    }
  }, [existingDraft, isDraftLoading]);

  // Prevent dialog from ever being shown if a draft did not exist at mount
  useEffect(() => {
    if (!isDraftLoading && !initialDraftExistsRef.current && showDraftDialog) {
      setShowDraftDialog(false);
    }
  }, [isDraftLoading, showDraftDialog]);

  // ...existing code...
  // Reset dialog session flag if user starts fresh or continues draft
  const handleContinueDraft = () => {
    if (existingDraft?.draftData) {
      const normalized = {
        ...getDefaultFormValues(),
        ...existingDraft.draftData,
      } as ActivityFormData;
      form.reset(normalized);
    }
    setShowDraftDialog(false);
    sessionStorage.removeItem(DRAFT_DIALOG_SESSION_KEY);
  };

  const handleStartFresh = () => {
    if (existingDraft) {
      deleteDraft();
    }
    setShowDraftDialog(false);
    draftCheckedRef.current = false;
    form.reset(getDefaultFormValues(), {
      keepDirty: false,
      keepTouched: false,
    });
    resetInitialFormData();
    sessionStorage.removeItem(DRAFT_DIALOG_SESSION_KEY);
  };

  const handleCancel = () => {
    // Delete the draft if it exists (hook uses delete-by-form; no need to await for close)
    if (existingDraft) {
      try {
        deleteDraft();
      } catch (e) {
        logger.warn('Error deleting draft on cancel', e);
      }
    }

    sessionStorage.removeItem(DRAFT_DIALOG_SESSION_KEY);
    form.reset();
    window.close();
  };

  const onSubmit = (data: ActivityFormData) => {
    setValidatedData(data);
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async (
    notes?: string,
    markAsReviewed?: boolean
  ) => {
    if (!validatedData) return;
    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      const submitData = buildPayloadForCreate(validatedData, formValues, {
        markAsReviewed: canReviewActivities ? markAsReviewed : undefined,
      });
      const payload = {
        ...submitData,
        ...(notes ? { activityHistoryNotes: notes } : {}),
      } as CreateActivityRequest;

      await createMutation.mutateAsync(payload);

      if (existingDraft) {
        deleteDraft();
      }

      toast.success('Activity created', {
        id: 'activity-created',
        description: validatedData.title
          ? `${validatedData.title}`
          : 'Your activity has been created.',
        duration: 2500,
      });
      // Brief delay so the success toast is visible before the popup closes
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.close();
    } catch (error) {
      logger.error('Failed to create activity', error);
      showErrorToast(error, 'Your activity could not be created.');
      // User remains on the form so they can correct and retry; do not close/navigate
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setValidatedData(null);
    }
  };

  const onError = () => {
    logger.error('Form validation failed');
    const missing = getMissingRequiredFields(
      form.formState,
      getActivityFieldLabel
    );
    const detail =
      missing.length > 0
        ? `Required fields missing: ${missing.join(', ')}`
        : 'Please fix the validation errors and try again.';
    toast.error('Submission failed', {
      description: detail,
      duration: 6000,
    });
  };

  const isFormValid = form.formState.isValid;
  const missingFields = getMissingRequiredFields(
    form.formState,
    getActivityFieldLabel
  );

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <StatusMessage
        title="Create New Activity"
        message="Loading..."
        variant="loading"
      />
    );
  }

  // Show access denied if user doesn't have permission to create activities
  if (!canCreateActivity) {
    return (
      <StatusMessage
        title={ACCESS_DENIED_TITLE}
        message={ACCESS_DENIED_CREATE_ACTIVITY_MESSAGE}
        variant="error"
      />
    );
  }

  // Show loading state if lookups are still loading
  if (lookups.isLoading) {
    return (
      <StatusMessage
        title="Create New Activity"
        message="Loading form data..."
        variant="loading"
      />
    );
  }

  // Show error state if lookups failed (but still allow form to be used with empty dropdowns)
  if (lookups.hasError) {
    logger.warn(
      'Failed to load some lookup data. Form may have empty dropdowns.'
    );
  }

  return (
    <ErrorBoundary FallbackComponent={FormErrorFallback}>
      <ResumeDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue where you left off?</DialogTitle>
            <DialogDescription>
              You have a saved draft for this activity form. Would you like to
              continue editing it, or start with a fresh form?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStartFresh} type="button">
              Start Fresh
            </Button>
            <Button onClick={handleContinueDraft} type="button">
              Continue Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </ResumeDialog>

      <ActivityBreadcrumb currentLabel="New activity" />
      <PageHeader
        title="Create New Activity"
        description="Fill in the activity details below"
        action={
          <AutosaveIndicator
            isAuthenticated={isAuthenticated}
            isSaving={isSaving}
            lastSaved={lastSaved}
            isLoading={isDraftLoading}
          />
        }
      />

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit, onError)(e);
          }}
        >
          {canCreateActivity && leadTeamOptionsError && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive mb-4 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>Could not load lead team options.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetchLeadTeamOptions();
                }}
              >
                Retry
              </Button>
            </div>
          )}
          <ActivityFormBody
            form={form}
            lookups={lookups}
            readOnly={false}
            showChangedBadges={false}
            leadTeamOptions={leadTeamOptions}
          />

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleCancel();
              }}
              disabled={isSubmitting}
              title="This will discard any draft data and close the page"
            >
              Cancel
            </Button>
            {!isFormValid && missingFields.length > 0 ? (
              <Popover open={showMissingFieldsPopover}>
                <PopoverTrigger asChild>
                  <div
                    onMouseEnter={() => setShowMissingFieldsPopover(true)}
                    onMouseLeave={() => setShowMissingFieldsPopover(false)}
                  >
                    <Button
                      type="submit"
                      disabled={true}
                      className="cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80"
                  onMouseEnter={() => setShowMissingFieldsPopover(true)}
                  onMouseLeave={() => setShowMissingFieldsPopover(false)}
                >
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Required fields missing:
                    </h4>
                    <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                      {missingFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </form>
      </Form>

      <CreateActivityConfirmModal
        open={showConfirmModal}
        onOpenChange={(open) => {
          setShowConfirmModal(open);
          if (!open) setValidatedData(null);
        }}
        formData={form.getValues()}
        lookups={lookups}
        dateStatuses={dateStatuses}
        timeStatuses={timeStatuses}
        leadTeamOptions={leadTeamOptions}
        onConfirm={(notes, markAsReviewed) =>
          void handleConfirmedSubmit(notes, markAsReviewed)
        }
        showMarkAsReviewed={canReviewActivities}
        isSubmitting={isSubmitting}
      />
    </ErrorBoundary>
  );
};
