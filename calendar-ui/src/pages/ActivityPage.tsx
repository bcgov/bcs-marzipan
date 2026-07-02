import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildActivityDisplayId, TEAM_PREFIX_FALLBACK } from '@corpcal/shared';
import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared/auth';
import {
  createActivityRequestSchema,
  type ActivityFormData,
  type ActivityResponse,
  type CloneActivityRequest,
  type UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import {
  ActivityFormBody,
  ActivityFormMissingFieldsHint,
  ActivityFormStickyHeader,
  ActivityPageHeader,
  ActivityStatusBanner,
} from '@/components/activity';
import ActivityHistory from '@/components/activity/activities/ActivityHistory';
import { CloneActivityModal } from '@/components/activity/activities/CloneActivityModal';
import { CompleteActionButtonLabel } from '@/components/activity/activities/CompleteActionButtonLabel';
import { CompleteActivityModal } from '@/components/activity/activities/CompleteActivityModal';
import { DeleteActivityModal } from '@/components/activity/activities/DeleteActivityModal';
import { DiscardActivityChangesDialog } from '@/components/activity/activities/DiscardActivityChangesDialog';
import { EditActivityConfirmModal } from '@/components/activity/activities/EditActivityConfirmModal';
import { RequestDeleteActivityModal } from '@/components/activity/activities/RequestDeleteActivityModal';
import { ReviewActionButtonLabel } from '@/components/activity/activities/ReviewActionButtonLabel';
import { ReviewActivityModal } from '@/components/activity/activities/ReviewActivityModal';
import {
  FormErrorFallback,
  LockBanner,
  LockBannerContent,
} from '@/components/shared';
import { Badge, normalizeActivityStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  startLockHandoffCountdownToast,
  type LockHandoffToastHandle,
} from '@/lib/lock-handoff-toast';

import { cloneActivity, fetchActivityHistory } from '../api/activitiesApi';
import { ApiError } from '../api/errors';
import { cancelForceHandoff, requestForceHandoff } from '../api/locksApi';
import { useActivityEditActions } from '../hooks/useActivityEditActions';
import { useActivityEditFormHydration } from '../hooks/useActivityEditFormHydration';
import { useActivityFormSetup } from '../hooks/useActivityFormSetup';
import { useActivityFormSubmitState } from '../hooks/useActivityFormSubmitState';
import { useActivityLock } from '../hooks/useActivityLock';
import { useActivityWebSocket } from '../hooks/useActivityWebSocket';
import { useAuth } from '../hooks/useAuth';
import {
  useDeleteActivity,
  useRequestDeleteActivity,
  useRestoreActivity,
  useSoftDeleteActivity,
  useSyncActivityFlags,
  useUpdateActivity,
} from '../hooks/useCalendar';
import {
  EDIT_LOCK_CONFLICT_TOAST,
  useEditLockIntent,
} from '../hooks/useEditLockIntent';
import { useEditLockSession } from '../hooks/useEditLockSession';
import { useElementIsIntersecting } from '../hooks/useElementIsIntersecting';
import { useFavourites } from '../hooks/useFavourites';
import { getActivityFieldLabel } from '../lib/activity-form-labels';
import { getActivityFormBackTarget } from '../lib/activity-form-navigation-state';
import {
  buildMarkReviewedOnlyPayload,
  buildPayloadForUpdate,
  type UpdatePayloadOptions,
} from '../lib/activity-form-payload';
import { resolveTranslationRequiredStatusId } from '../lib/activity-form-translation-required';
import { computeFormChanges } from '../lib/activity-history-format';
import { showActivityMutationSuccessToast } from '../lib/activity-mutation-success-toast';
import { resolveActivityToastDisplayId } from '../lib/activity-toast-options';
import { formatActivityEndDateTimeLabel } from '../lib/datetime-utils';
import { showErrorToast } from '../lib/error-toast';
import { createLogger } from '../lib/logger';

const logger = createLogger('ActivityPage');

/** Match sticky back bar height (py-3 + h-8 sm button ≈ 56px). IO rootMargin only accepts px or %. */
const LOCK_BANNER_INTERSECTION_ROOT_MARGIN = '-56px 0px 0px 0px';

export type ActivityPageProps = {
  activity: ActivityResponse;
  refreshActivity: () => Promise<void>;
};

export function ActivityPage({
  activity,
  refreshActivity,
}: ActivityPageProps): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const id = activity.id;
  const {
    isFavourite,
    toggle: toggleFavourite,
    isToggling: isFavouriteToggling,
  } = useFavourites();

  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);
  const hasCreateAny = hasPermission(PERMISSIONS.ACTIVITIES.CREATE_ANY);
  const apiCanEdit = (activity as ActivityResponse & { canEdit?: boolean })
    .canEdit;
  /** API omits canEdit only for unauthenticated responses; treat missing as not editable. */
  const canEditActivity =
    hasPermission(PERMISSIONS.ACTIVITIES.EDIT) && (apiCanEdit ?? false);
  const leadTeamFetchEnabled = canCreateActivity || canEditActivity;

  const {
    form,
    lookups,
    leadTeamOptions,
    leadTeamOptionsError,
    leadTeamOptionsFetching,
    refetchLeadTeamOptions,
    commsContactCandidates,
  } = useActivityFormSetup({
    mode: 'edit',
    leadTeamFetchEnabled,
    userId: user?.id,
    userTeamIds: user?.teamIds,
    hasCreateAny,
  });
  const { isFormValid, missingFields, missingFieldsHelperText } =
    useActivityFormSubmitState(form, {
      getFieldLabel: getActivityFieldLabel,
      schema: createActivityRequestSchema,
    });
  const requiredTranslationStatusId = useMemo(
    () =>
      resolveTranslationRequiredStatusId(lookups.translationRequiredStatuses),
    [lookups.translationRequiredStatuses]
  );
  const canReviewActivities = hasPermission(PERMISSIONS.ACTIVITIES.REVIEW);
  const reviewerChangedPaths = useMemo<ReadonlySet<string>>(() => {
    const paths = canReviewActivities
      ? activity.changedFieldsSinceReview
      : undefined;
    return paths ? new Set(paths) : new Set<string>();
  }, [canReviewActivities, activity.changedFieldsSinceReview]);
  const isAdminOrSysAdmin =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
  const isCommsContact =
    activity.commsContacts?.some((c) => c.userId === user?.id) ?? false;
  const leadTeamId = activity.leadTeamId ?? null;
  const isLeadTeamMember =
    leadTeamId != null &&
    Array.isArray(user?.teamIds) &&
    user.teamIds.includes(leadTeamId);
  const activityStatusName = activity.activityStatus ?? '';
  const normalizedStatus = normalizeActivityStatus(activityStatusName);
  const isBlockedStatus =
    normalizedStatus === 'delete_requested' || normalizedStatus === 'deleted';
  const canViewActivity = hasPermission(PERMISSIONS.ACTIVITIES.VIEW);
  const canCompleteActivities = hasPermission(PERMISSIONS.ACTIVITIES.COMPLETE);
  const markCompleteEligible =
    (activity as ActivityResponse & { markCompleteEligible?: boolean })
      .markCompleteEligible ?? false;
  const canDelete = hasPermission(PERMISSIONS.ACTIVITIES.DELETE);
  const canForceHandoff = hasPermission(
    PERMISSIONS.ACTIVITIES.LOCK_FORCE_HANDOFF
  );
  const canRequestDelete = hasPermission(PERMISSIONS.ACTIVITIES.REQUEST_DELETE);
  const canDeleteAny = hasPermission(PERMISSIONS.ACTIVITIES.DELETE_ANY);
  const canEditWhenBlocked = canDeleteAny;
  const canFlag = hasPermission(PERMISSIONS.ACTIVITIES.FLAG);
  const canRestore =
    normalizedStatus === 'deleted'
      ? canDeleteAny
      : normalizedStatus === 'delete_requested'
        ? (canRequestDelete || canDelete || canDeleteAny) &&
          (isAdminOrSysAdmin || isCommsContact || isLeadTeamMember)
        : false;
  const showDeleteButton =
    canDelete && (canDeleteAny || isCommsContact || isLeadTeamMember);
  const showRequestDeleteButton =
    !isBlockedStatus &&
    (isCommsContact || isLeadTeamMember) &&
    canRequestDelete &&
    !canDelete;

  const {
    lock,
    lockState,
    lockedByUsername,
    acquire,
    release,
    refreshLockFromServer,
    sendHeartbeat,
    applyExternalLockReleased,
    setLockedByOther,
    clearLockedByOther,
  } = useActivityLock(id, user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [forceHandoffPending, setForceHandoffPending] = useState(false);
  const [cancelHandoffPending, setCancelHandoffPending] = useState(false);
  const [handoffAwaitingCompletion, setHandoffAwaitingCompletion] =
    useState(false);
  const handoffAwaitingCompletionRef = useRef(false);
  const handoffToastHandleRef = useRef<LockHandoffToastHandle | null>(null);

  useEffect(() => {
    handoffAwaitingCompletionRef.current = handoffAwaitingCompletion;
  }, [handoffAwaitingCompletion]);

  useEffect(() => {
    setHandoffAwaitingCompletion(false);
    return () => {
      handoffToastHandleRef.current?.dispose();
      handoffToastHandleRef.current = null;
    };
  }, [id]);

  useEditLockSession({
    form,
    activityId: id,
    lockState,
    lock,
    isEditing,
    sendHeartbeat,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRequestDeleteModal, setShowRequestDeleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [deleteModalInitialNotes, setDeleteModalInitialNotes] = useState<
    string | undefined
  >(undefined);
  /**
   * Forces remount of form-body UI controls (combobox/popover/select internals)
   * when edit lock is externally lost, so open overlays cannot remain stuck.
   */
  const [formUiEpoch, setFormUiEpoch] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRequestDeleteSubmitting, setIsRequestDeleteSubmitting] =
    useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [validatedData, setValidatedData] = useState<ActivityFormData | null>(
    null
  );
  const { isFormHydrated, hydrationGeneration, initialFormDataRef } =
    useActivityEditFormHydration(activity, lookups, form);

  const updateMutation = useUpdateActivity();
  const deleteMutation = useDeleteActivity();
  const restoreMutation = useRestoreActivity();
  const softDeleteMutation = useSoftDeleteActivity();
  const requestDeleteMutation = useRequestDeleteActivity();
  const syncFlagsMutation = useSyncActivityFlags({
    onSuccess: () => void refreshActivity(),
  });

  const handleRequestForceHandoff = useCallback(async () => {
    setForceHandoffPending(true);
    try {
      await requestForceHandoff(id);
      setHandoffAwaitingCompletion(true);
    } catch (err) {
      showErrorToast(err, 'Could not request lock transfer');
    } finally {
      setForceHandoffPending(false);
    }
  }, [id]);

  const handleCancelForceHandoff = useCallback(async () => {
    setCancelHandoffPending(true);
    try {
      await cancelForceHandoff(id);
      handoffToastHandleRef.current?.notifyHandoffCancelled();
      setHandoffAwaitingCompletion(false);
    } catch (err) {
      showErrorToast(err, 'Could not cancel unlock request');
    } finally {
      setCancelHandoffPending(false);
    }
  }, [id]);

  useActivityWebSocket(id, {
    onLockAcquired: (lockedBy) => {
      if (user?.id != null && lockedBy.userId === user?.id) {
        const wasHandoff = handoffAwaitingCompletionRef.current;
        setHandoffAwaitingCompletion(false);
        if (wasHandoff) {
          handoffToastHandleRef.current?.dismissLoadingOnly();
        } else {
          handoffToastHandleRef.current?.notifyLockAcquired();
        }
        void refreshLockFromServer();
        return;
      }
      if (lockState !== 'owned') {
        setLockedByOther(lockedBy.username);
      }
    },
    onLockReleased: () => {
      const initialData = initialFormDataRef.current;
      // Revert unsaved edits when we lose the lock while in edit mode; baseline is kept in initialFormDataRef.
      const shouldResetForm = isEditing && initialData != null;
      clearLockedByOther();
      applyExternalLockReleased();
      setFormUiEpoch((epoch) => epoch + 1);
      setIsEditing(false);
      if (shouldResetForm) {
        // Do not call form.reset (and thus TipTap setContent via RHF) during React render or commit phases.
        // queueMicrotask matches rich-text-field deferred sync and avoids render-phase editor updates.
        queueMicrotask(() => {
          form.reset(initialData);
        });
      }
      void refreshActivity();
    },
    onDataUpdated: () => {
      void refreshActivity();
    },
    onLockHandoffPending: (payload) => {
      handoffToastHandleRef.current?.dispose();
      handoffToastHandleRef.current = startLockHandoffCountdownToast(payload);
      if (payload.role === 'requester') {
        setHandoffAwaitingCompletion(true);
      }
    },
    onLockHandoffCancelled: () => {
      handoffToastHandleRef.current?.notifyHandoffCancelled();
      setHandoffAwaitingCompletion(false);
    },
    onLockHandoffResolved: (payload) => {
      setHandoffAwaitingCompletion(false);
      if (payload.outcome === 'cancelled') {
        handoffToastHandleRef.current?.notifyHandoffCancelled();
        return;
      }
      handoffToastHandleRef.current?.dispose();
      handoffToastHandleRef.current = null;
      if (payload.outcome === 'completed') {
        if (payload.role === 'holder') {
          toast.info(
            `Edit access was transferred to ${payload.counterpartUsername}.`,
            { duration: 6000 }
          );
        } else {
          toast.success('The activity is ready to edit.', {
            id: `lock-handoff-success-${payload.activityId}`,
            duration: 5000,
          });
          void refreshLockFromServer();
        }
        return;
      }
      if (payload.outcome === 'aborted_no_holder_lock') {
        toast.warning(
          'Lock transfer could not complete. The activity is no longer held by the original editor.',
          { duration: 8000 }
        );
      }
    },
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const mayEdit =
    canEditActivity &&
    lockState !== 'locked-by-other' &&
    lockState !== 'checking' &&
    lockState !== 'acquiring' &&
    (!isBlockedStatus || canEditWhenBlocked);

  const handleGoBack = useCallback(() => {
    const fromState = getActivityFormBackTarget(location.state);
    if (fromState != null) {
      void navigate(fromState);
      return;
    }
    if (window.history.length > 1) {
      void navigate(-1);
    } else {
      void navigate('/');
    }
  }, [navigate, location.state]);

  const mayEditFormFields =
    canEditActivity && (!isBlockedStatus || canEditWhenBlocked);
  /** Show the Clone button when the user can create and has edit eligibility on the source. Blocked-status gating is already handled by `canEditWhenBlocked` (which requires `activities.delete.any`). */
  const canCloneActivity = canCreateActivity && mayEditFormFields;
  /** True when the user cannot edit for permission/status reasons (not merely waiting on a lock). */
  const isViewOnlyByPermission = !mayEditFormFields;
  const readOnly = lockState === 'locked-by-other' || !mayEditFormFields;
  const hasEditLock = lockState === 'owned';
  const isLockedByOther = lockState === 'locked-by-other';
  const [lockBannerSentinel, setLockBannerSentinel] =
    useState<HTMLDivElement | null>(null);
  const lockBannerInView = useElementIsIntersecting(
    lockBannerSentinel,
    isLockedByOther,
    LOCK_BANNER_INTERSECTION_ROOT_MARGIN,
    0
  );
  const actionFlags = useActivityEditActions({
    lockState,
    mayEditFormFields,
    canReviewActivities,
    canCompleteActivities,
    markCompleteEligible,
    hasEditLock,
    canSubmitWithoutValidationErrors: isFormValid,
    isSubmitting,
    readOnly,
    isDirty,
  });

  const reviewModalActivityEndedAtLabel = useMemo(
    () =>
      formatActivityEndDateTimeLabel(
        activity.endDate,
        activity.endTime,
        activity.isAllDay
      ),
    [activity.endDate, activity.endTime, activity.isAllDay]
  );

  const onEditLockAcquireConflict = useCallback(() => {
    toast.error(EDIT_LOCK_CONFLICT_TOAST);
  }, []);

  useEditLockIntent({
    formHydrated: isFormHydrated,
    hydrationGeneration,
    mayEdit,
    isEditing,
    setIsEditing,
    acquire,
    lockState,
    form,
    initialFormDataRef,
    onAcquireConflict: onEditLockAcquireConflict,
  });

  const handleOpenDeleteModal = useCallback(async () => {
    if (normalizedStatus === 'delete_requested') {
      try {
        const history = await fetchActivityHistory(id);
        const deleteRequestedEntry = history.find(
          (e) => e.actionType === 'delete_requested'
        );
        const note =
          deleteRequestedEntry?.notes?.trim() &&
          deleteRequestedEntry.notes.trim().length > 0
            ? deleteRequestedEntry.notes.trim()
            : undefined;
        setDeleteModalInitialNotes(note);
      } catch (err) {
        logger.error('Failed to load activity history for delete modal', err);
        setDeleteModalInitialNotes(undefined);
      }
    } else {
      setDeleteModalInitialNotes(undefined);
    }
    setShowDeleteModal(true);
  }, [id, normalizedStatus]);

  const ensureEditThen = useCallback(
    (action: () => void) => {
      if (isEditing) {
        action();
        return;
      }
      setIsEditing(true);
      void acquire().then((ok) => {
        if (ok) {
          action();
        } else {
          setIsEditing(false);
          toast.error(EDIT_LOCK_CONFLICT_TOAST);
        }
      });
    },
    [isEditing, acquire]
  );

  const handleConfirmLeave = async () => {
    setShowLeaveConfirm(false);
    await release();
    setIsEditing(false);
    if (initialFormDataRef.current) {
      form.reset(initialFormDataRef.current);
    }
  };

  const onSubmit = (data: ActivityFormData) => {
    setValidatedData(data);
    setShowConfirmModal(true);
  };

  type SubmitActivityMode =
    | { kind: 'update'; validatedData: ActivityFormData; notes?: string }
    | { kind: 'reviewOnly'; notes?: string }
    | {
        kind: 'reviewWithSave';
        validatedData: ActivityFormData;
        notes?: string;
      }
    | {
        kind: 'completeOnly';
        notes?: string;
      }
    | {
        kind: 'completeWithSave';
        validatedData: ActivityFormData;
        notes?: string;
      };

  const runSubmitUpdate = useCallback(
    async (mode: SubmitActivityMode) => {
      setIsSubmitting(true);
      try {
        let submitData: UpdateActivityRequest;

        if (mode.kind === 'reviewOnly') {
          submitData = {
            ...buildMarkReviewedOnlyPayload(mode.notes),
          };
        } else if (mode.kind === 'completeOnly') {
          submitData = {
            markAsCompleted: true,
            ...(mode.notes ? { activityHistoryNotes: mode.notes } : {}),
          };
        } else {
          const opts: UpdatePayloadOptions =
            mode.kind === 'reviewWithSave'
              ? { markAsReviewed: true, requiredTranslationStatusId }
              : mode.kind === 'completeWithSave'
                ? { markAsCompleted: true, requiredTranslationStatusId }
                : { requiredTranslationStatusId };
          submitData = {
            ...buildPayloadForUpdate(
              mode.validatedData,
              form.getValues(),
              opts
            ),
            ...(mode.notes ? { activityHistoryNotes: mode.notes } : {}),
          };
        }

        const updated = await updateMutation.mutateAsync({
          id,
          data: submitData,
        });
        const titleForToast =
          mode.kind === 'reviewOnly' || mode.kind === 'completeOnly'
            ? (activity.title ?? '')
            : (mode.validatedData.title ?? '');
        const subtitleTitle =
          titleForToast.trim().length > 0
            ? titleForToast
            : (updated.title ?? '');
        showActivityMutationSuccessToast({
          toastId: `activity-updated-${id}`,
          kind: 'updated',
          displayId: resolveActivityToastDisplayId(
            updated.displayId,
            updated.id
          ),
          title: subtitleTitle,
          activityId: id,
          showViewButton: canViewActivity,
          onViewNavigate: (aid) => {
            void navigate(`/activity/${aid}`);
          },
        });
        // Backend update flow already releases the lock; clear local hold to
        // avoid keepalive release during unmount/navigation.
        applyExternalLockReleased();
        void navigate('/');
      } catch (err) {
        logger.error('Failed to update activity', err);
        const message =
          err instanceof ApiError && err.status === 409
            ? 'The entry is locked by another user. Your changes could not be saved.'
            : 'Your changes could not be saved.';
        showErrorToast(err, message);
      } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false);
        setShowReviewModal(false);
        setShowCompleteModal(false);
        setValidatedData(null);
      }
    },
    [
      id,
      updateMutation,
      form,
      activity.title,
      canViewActivity,
      applyExternalLockReleased,
      navigate,
      requiredTranslationStatusId,
    ]
  );

  const handleConfirmedSubmit = async (notes?: string) => {
    if (!validatedData) return;
    await runSubmitUpdate({ kind: 'update', validatedData, notes });
  };

  const onError = () => {
    logger.error('Form validation failed');
    const detail =
      missingFields.length > 0
        ? `Required fields missing: ${missingFields.join(', ')}`
        : 'Please fix the validation errors and try again.';
    toast.error('Submission failed', {
      description: detail,
      duration: 6000,
    });
  };

  const handleReviewConfirm = async (
    notes?: string,
    markAsCompleted?: boolean,
    unassignMe?: boolean
  ) => {
    if (unassignMe) {
      const flagsByTeam = new Map<number, number[]>();
      (activity.flags ?? []).forEach((flag) => {
        const next = flagsByTeam.get(flag.teamId) ?? [];
        next.push(flag.assigneeId);
        flagsByTeam.set(flag.teamId, next);
      });
      flagsByTeam.forEach((assigneeIds, teamId) => {
        const nextAssigneeIds = assigneeIds.filter((aId) => aId !== user?.id);
        syncFlagsMutation.mutate({
          activityId: id,
          body: { teamId, assigneeIds: nextAssigneeIds },
        });
      });
    }
    if (markAsCompleted) {
      if (isDirty) {
        await form.handleSubmit(async (data) => {
          await runSubmitUpdate({
            kind: 'completeWithSave',
            validatedData: data,
            notes,
          });
        }, onError)();
      } else {
        await runSubmitUpdate({ kind: 'completeOnly', notes });
      }
      return;
    }
    if (isDirty) {
      await form.handleSubmit(async (data) => {
        await runSubmitUpdate({
          kind: 'reviewWithSave',
          validatedData: data,
          notes,
        });
      }, onError)();
    } else {
      await runSubmitUpdate({ kind: 'reviewOnly', notes });
    }
  };

  const handleCompleteConfirm = async (notes?: string) => {
    if (isDirty) {
      await form.handleSubmit(async (data) => {
        await runSubmitUpdate({
          kind: 'completeWithSave',
          validatedData: data,
          notes,
        });
      }, onError)();
    } else {
      await runSubmitUpdate({ kind: 'completeOnly', notes });
    }
  };

  const handleCloneConfirm = async (payload: CloneActivityRequest) => {
    setIsCloning(true);
    try {
      const created = await cloneActivity(id, payload);
      setShowCloneModal(false);
      const toastId = `activity-cloned-${created.id}`;
      const subtitleTitle =
        payload.title.trim().length > 0
          ? payload.title.trim()
          : (created.title ?? '');
      showActivityMutationSuccessToast({
        toastId,
        kind: 'cloned',
        displayId: resolveActivityToastDisplayId(created.displayId, created.id),
        title: subtitleTitle,
        activityId: created.id,
        showViewButton: canViewActivity,
        onViewNavigate: (aid) => {
          void navigate(`/activity/${aid}`);
        },
      });
      const backTarget = getActivityFormBackTarget(location.state) ?? '/';
      void navigate(backTarget, { replace: true });
    } catch (err) {
      logger.error('Failed to clone activity', err);
      showErrorToast(
        err,
        'Your activity could not be cloned. If the problem persists, please contact calendar admins.'
      );
    } finally {
      setIsCloning(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreMutation.mutateAsync({ id });
      await refreshActivity();
      toast.success('Activity restored');
    } catch (err) {
      logger.error('Failed to restore activity', err);
      showErrorToast(err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRequestDeleteConfirm = async (reason: string) => {
    setIsRequestDeleteSubmitting(true);
    try {
      await requestDeleteMutation.mutateAsync({ id, body: { reason } });
      await refreshActivity();
      setShowRequestDeleteModal(false);
      toast.success('Delete requested');
    } catch (err) {
      logger.error('Failed to request delete', err);
      showErrorToast(err);
    } finally {
      setIsRequestDeleteSubmitting(false);
    }
  };

  const handleSoftDelete = async (reason: string) => {
    setIsDeleteSubmitting(true);
    try {
      await softDeleteMutation.mutateAsync({ id, body: { reason } });
      await refreshActivity();
      setShowDeleteModal(false);
      toast.success('Activity soft deleted');
    } catch (err) {
      logger.error('Failed to soft delete activity', err);
      const message =
        err instanceof ApiError && err.status === 403
          ? 'You do not have permission to delete this activity'
          : undefined;
      showErrorToast(err, message);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleHardDelete = async (reason: string) => {
    setIsDeleteSubmitting(true);
    try {
      await deleteMutation.mutateAsync({
        id,
        body: reason.trim().length > 0 ? { reason: reason.trim() } : undefined,
      });
      setShowDeleteModal(false);
      toast.success('Activity permanently deleted');
      void navigate('/');
    } catch (err) {
      logger.error('Failed to delete activity', err);
      const message =
        err instanceof ApiError && err.status === 403
          ? 'You do not have permission to delete this activity'
          : undefined;
      showErrorToast(err, message);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const confirmModalChanges =
    showConfirmModal && initialFormDataRef.current
      ? computeFormChanges(initialFormDataRef.current, form.getValues())
      : [];

  const discardModalChanges =
    showLeaveConfirm && initialFormDataRef.current
      ? computeFormChanges(initialFormDataRef.current, form.getValues())
      : [];

  const displayId =
    activity.displayId ??
    buildActivityDisplayId(TEAM_PREFIX_FALLBACK, activity.id);
  const categories = activity.category ?? [];

  return (
    <ErrorBoundary FallbackComponent={FormErrorFallback}>
      <ActivityFormStickyHeader
        onBack={handleGoBack}
        lockStrip={
          isLockedByOther ? (
            <LockBannerContent
              lockedByUsername={lockedByUsername}
              onRequestTakeLock={
                canForceHandoff
                  ? () => void handleRequestForceHandoff()
                  : undefined
              }
              requestTakeLockPending={forceHandoffPending}
              handoffActive={handoffAwaitingCompletion}
              onCancelHandoff={
                canForceHandoff
                  ? () => void handleCancelForceHandoff()
                  : undefined
              }
              cancelHandoffPending={cancelHandoffPending}
              className="max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1"
            />
          ) : undefined
        }
        lockStripVisible={isLockedByOther && !lockBannerInView}
      />
      <ActivityPageHeader
        displayId={displayId}
        title={activity.title ?? ''}
        categories={categories}
        leadMinistry={activity.leadMinistry ?? null}
        activityStatus={activity.activityStatus ?? null}
        lastUpdatedDateTime={activity.lastUpdatedDateTime ?? null}
        createdDateTime={activity.createdDateTime ?? null}
        onHistoryClick={() => setHistoryOpen(true)}
        flags={activity.flags ?? []}
        canFlag={canFlag}
        onFlagSync={
          canFlag
            ? (teamId, assigneeIds, note, assigneeNames) =>
                syncFlagsMutation.mutate({
                  activityId: id,
                  body: { teamId, assigneeIds, note },
                  assigneeNames,
                })
            : undefined
        }
        onFlagUnassign={(teamId, assigneeName) =>
          syncFlagsMutation.mutate({
            activityId: id,
            body: { teamId, assigneeIds: [] },
            assigneeNames: assigneeName ? [assigneeName] : undefined,
          })
        }
        isFlagPending={syncFlagsMutation.isPending}
        isFavourite={isFavourite(id)}
        onFavouriteToggle={() => toggleFavourite(id)}
        isFavouriteToggling={isFavouriteToggling}
      />
      {isLockedByOther && (
        <div ref={setLockBannerSentinel}>
          <LockBanner
            inert={!lockBannerInView}
            lockedByUsername={lockedByUsername}
            onRequestTakeLock={
              canForceHandoff
                ? () => void handleRequestForceHandoff()
                : undefined
            }
            requestTakeLockPending={forceHandoffPending}
            handoffActive={handoffAwaitingCompletion}
            onCancelHandoff={
              canForceHandoff
                ? () => void handleCancelForceHandoff()
                : undefined
            }
            cancelHandoffPending={cancelHandoffPending}
          />
        </div>
      )}
      {isBlockedStatus && (
        <ActivityStatusBanner
          status={activityStatusName}
          canRestore={canRestore}
          canEditWhenBlocked={canEditWhenBlocked}
          onRestore={handleRestore}
          isRestoring={isRestoring}
        />
      )}
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (hasEditLock) {
              void form.handleSubmit(onSubmit, onError)(e);
            }
          }}
        >
          {(canCreateActivity || canEditActivity) && leadTeamOptionsError && (
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
            key={formUiEpoch}
            lookups={lookups}
            commsContactCandidates={commsContactCandidates}
            readOnly={readOnly}
            reviewerChangedPaths={reviewerChangedPaths}
            leadTeamField={{
              options: leadTeamOptions,
              displayLabel:
                (
                  activity as ActivityResponse & {
                    leadTeamDisplayName?: string | null;
                  }
                ).leadTeamDisplayName ?? null,
              optionsFetching: leadTeamOptionsFetching,
            }}
          />
          <div className="bg-background sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              {isViewOnlyByPermission && (
                <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary">View-only</Badge>
                  <span>You cannot edit this activity.</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {showRequestDeleteButton && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      ensureEditThen(() => setShowRequestDeleteModal(true));
                    }}
                    disabled={isSubmitting || actionFlags.isLockedByOther}
                  >
                    Request delete
                  </Button>
                )}
                {showDeleteButton && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      ensureEditThen(() => void handleOpenDeleteModal());
                    }}
                    disabled={isSubmitting || actionFlags.isLockedByOther}
                  >
                    Delete
                  </Button>
                )}
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="animate-in fade-in duration-200"
                    onClick={() => setShowLeaveConfirm(true)}
                    disabled={isSubmitting}
                  >
                    Discard changes
                  </Button>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-4">
              {missingFieldsHelperText != null && (
                <ActivityFormMissingFieldsHint
                  helperText={missingFieldsHelperText}
                  fields={missingFields}
                />
              )}
              {canCloneActivity && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCloneModal(true)}
                  disabled={isSubmitting || isLockedByOther || isDirty}
                >
                  Clone
                </Button>
              )}
              <Button
                type="submit"
                variant={
                  canReviewActivities || actionFlags.showCompleteAction
                    ? 'outline'
                    : 'default'
                }
                disabled={!actionFlags.canSubmitUpdate}
                className={!isFormValid ? 'cursor-not-allowed' : undefined}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
              {actionFlags.showReviewAction && (
                <Button
                  type="button"
                  aria-label={isDirty ? 'Save and Review' : 'Review'}
                  disabled={!actionFlags.reviewActionEnabled}
                  className={
                    isDirty && !isFormValid ? 'cursor-not-allowed' : undefined
                  }
                  onClick={() => ensureEditThen(() => setShowReviewModal(true))}
                >
                  <ReviewActionButtonLabel isDirty={isDirty} />
                </Button>
              )}
              {actionFlags.showCompleteAction &&
                !actionFlags.showReviewAction && (
                  <Button
                    type="button"
                    aria-label={isDirty ? 'Save and complete' : 'Complete'}
                    disabled={!actionFlags.completeActionEnabled}
                    className={
                      isDirty && !isFormValid ? 'cursor-not-allowed' : undefined
                    }
                    onClick={() =>
                      ensureEditThen(() => setShowCompleteModal(true))
                    }
                  >
                    <CompleteActionButtonLabel isDirty={isDirty} />
                  </Button>
                )}
            </div>
          </div>
        </form>
      </Form>
      <ActivityHistory
        activityId={id}
        open={historyOpen}
        onOpenChange={(v) => setHistoryOpen(!!v)}
        dateStatuses={lookups.dateStatuses}
        venueStatuses={lookups.venueStatuses}
      />
      <DiscardActivityChangesDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        changes={discardModalChanges}
        onReturnToEdit={() => setShowLeaveConfirm(false)}
        onDiscard={() => void handleConfirmLeave()}
      />
      <EditActivityConfirmModal
        open={showConfirmModal}
        onOpenChange={(open) => {
          setShowConfirmModal(open);
          if (!open) setValidatedData(null);
        }}
        changes={confirmModalChanges}
        onConfirm={(notes) => void handleConfirmedSubmit(notes)}
        isSubmitting={isSubmitting}
      />
      <ReviewActivityModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onConfirm={(notes, markAsCompleted, unassignMe) =>
          void handleReviewConfirm(notes, markAsCompleted, unassignMe)
        }
        displayId={displayId}
        showMarkAsCompletedOption={actionFlags.showCompleteAction}
        activityEndedAtLabel={reviewModalActivityEndedAtLabel}
        showUnassignMeOption={(activity.flags ?? []).some(
          (f) => f.assigneeId === user?.id
        )}
      />
      <CompleteActivityModal
        open={showCompleteModal}
        onOpenChange={setShowCompleteModal}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onConfirm={(notes) => void handleCompleteConfirm(notes)}
        displayId={displayId}
      />
      <RequestDeleteActivityModal
        open={showRequestDeleteModal}
        onOpenChange={setShowRequestDeleteModal}
        onConfirm={handleRequestDeleteConfirm}
        isSubmitting={isRequestDeleteSubmitting}
      />
      <CloneActivityModal
        open={showCloneModal}
        onOpenChange={setShowCloneModal}
        sourceTitle={activity.title ?? ''}
        sourceDisplayId={activity.displayId ?? null}
        lookups={lookups}
        isSubmitting={isCloning}
        showMarkAsReviewed={canReviewActivities}
        onConfirm={(payload) => void handleCloneConfirm(payload)}
      />
      <DeleteActivityModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) setDeleteModalInitialNotes(undefined);
        }}
        activityId={id}
        displayId={displayId}
        onSoftDelete={handleSoftDelete}
        onHardDelete={handleHardDelete}
        isSubmitting={isDeleteSubmitting}
        initialNotes={deleteModalInitialNotes}
      />
    </ErrorBoundary>
  );
}
