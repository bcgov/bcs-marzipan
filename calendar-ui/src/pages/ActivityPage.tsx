import { ErrorBoundary } from 'react-error-boundary';
import {
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
} from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildActivityDisplayId,
  getActivityFormSectionFieldKeys,
  TEAM_PREFIX_FALLBACK,
} from '@corpcal/shared';
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
import { UnshareActivityModal } from '@/components/activity/activities/UnshareActivityModal';
import {
  ActivityConnectionStatusAlert,
  FormErrorFallback,
  LockBanner,
  LockBannerContent,
  LockoutBanner,
  LockoutBannerContent,
} from '@/components/shared';
import { Badge, normalizeActivityStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  startLockHandoffCountdownToast,
  type LockHandoffToastHandle,
} from '@/lib/lock-handoff-toast';

import {
  cloneActivity,
  fetchActivity,
  fetchActivityHistory,
} from '../api/activitiesApi';
import { ApiError } from '../api/errors';
import { cancelForceHandoff, requestForceHandoff } from '../api/locksApi';
import { useActivityEditActions } from '../hooks/useActivityEditActions';
import { useActivityEditConnectionUi } from '../hooks/useActivityEditConnectionUi';
import { useActivityEditFormHydration } from '../hooks/useActivityEditFormHydration';
import { useActivityFormSetup } from '../hooks/useActivityFormSetup';
import { useActivityFormSubmitState } from '../hooks/useActivityFormSubmitState';
import { useActivityLock } from '../hooks/useActivityLock';
import { useActivityWebSocket } from '../hooks/useActivityWebSocket';
import { useAuth } from '../hooks/useAuth';
import {
  useDeleteActivity,
  useRemoveAssigneeActivityFlag,
  useRequestDeleteActivity,
  useRestoreActivity,
  useSoftDeleteActivity,
  useSyncActivityFlags,
  useUnshareActivityTeam,
  useUpdateActivity,
} from '../hooks/useCalendar';
import {
  EDIT_LOCK_CONFLICT_TOAST,
  useEditLockIntent,
} from '../hooks/useEditLockIntent';
import { useEditLockSession } from '../hooks/useEditLockSession';
import { useElementIsIntersecting } from '../hooks/useElementIsIntersecting';
import { useFavourites } from '../hooks/useFavourites';
import { useRecurringEditLockout } from '../hooks/useRecurringLockoutBanner';
import { useRecurringLockoutSession } from '../hooks/useRecurringLockoutSession';
import { getActivityConcurrencyToken } from '../lib/activity-concurrency-token';
import { resolveActivityEditResyncAction } from '../lib/activity-edit-resync';
import {
  connectionBlocksFieldInputUnlessActiveSession,
  getActivityConfirmBlockedMessage,
  getActivityConfirmBlockedNotice,
  getActivityEditAcquireFailureToastMessage,
  getActivityEditAcquireFailureToastVariant,
  getActivityEditRecoveryBannerMessage,
  getActivitySubmitBlockedToastTitle,
  isActivityEditSessionActionsBlocked,
  shouldShowActivityConnectionAlert,
  shouldSuppressAcquireConnectionToast,
  shouldWarnActivityEditBeforeUnload,
  type ActivityEditConfirmAction,
  type ActivityEditRecoveryState,
} from '../lib/activity-edit-session-messages';
import { getActivityFieldLabel } from '../lib/activity-form-labels';
import {
  buildActivityListScrollRestoreReturnState,
  getActivityFormBackTarget,
} from '../lib/activity-form-navigation-state';
import {
  buildMarkReviewedOnlyPayload,
  buildPayloadForUpdate,
  type UpdatePayloadOptions,
} from '../lib/activity-form-payload';
import { resolveTranslationRequiredStatusId } from '../lib/activity-form-translation-required';
import { computeFormChanges } from '../lib/activity-history-format';
import { showActivityMutationSuccessToast } from '../lib/activity-mutation-success-toast';
import { isActivitySocketConnectionBlocked } from '../lib/activity-socket-connection-display';
import { resolveActivityToastDisplayId } from '../lib/activity-toast-options';
import { formatActivityEndDateTimeLabel } from '../lib/datetime-utils';
import { showActionBlockedToast, showErrorToast } from '../lib/error-toast';
import { formatDiscardChangesLabel } from '../lib/form-field-highlight';
import { focusFirstInvalidField, focusRequiredField } from '../lib/form-utils';
import { createLogger } from '../lib/logger';
import {
  getRecurringEditLockoutErrorMessage,
  RECURRING_EDIT_LOCKOUT_UI_MESSAGE,
} from '../lib/recurring-edit-lockout-error';
import { getRecurringLockoutInlineMessage } from '../lib/recurring-lockout-inline-message';
import { TOAST_DURATION_MS } from '../lib/toast-durations';
import {
  getUnshareableTeamsForActivity,
  resolveUnsharePermissions,
} from '../lib/unshare-helpers';

const logger = createLogger('ActivityPage');

/** Match sticky back bar height (py-3 + h-8 sm button ≈ 56px). IO rootMargin only accepts px or %. */
const LOCK_BANNER_INTERSECTION_ROOT_MARGIN = '-56px 0px 0px 0px';

export type ActivityPageProps = {
  activity: ActivityResponse;
  refreshActivity: () => Promise<void>;
};

type DiscardChangesButtonProps = {
  control: Control<ActivityFormData>;
  getValues: UseFormGetValues<ActivityFormData>;
  initialFormData: ActivityFormData | null;
  isDirty: boolean;
  isSubmitting: boolean;
  onClick: () => void;
};

function DiscardChangesButton({
  control,
  getValues,
  initialFormData,
  isDirty,
  isSubmitting,
  onClick,
}: DiscardChangesButtonProps): React.ReactElement | null {
  useWatch({ control });
  const changeCount = initialFormData
    ? computeFormChanges(initialFormData, getValues()).length
    : 0;

  if (!isDirty) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="animate-in fade-in duration-200"
      onClick={onClick}
      disabled={isSubmitting}
    >
      {changeCount > 0
        ? formatDiscardChangesLabel(changeCount)
        : 'Discard changes'}
    </Button>
  );
}

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
  const {
    isFormValid,
    missingFields,
    missingFieldItems,
    missingFieldsHelperText,
  } = useActivityFormSubmitState(form, {
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
    normalizedStatus !== 'deleted' &&
    canDelete &&
    (canDeleteAny || isCommsContact || isLeadTeamMember);
  const showRequestDeleteButton =
    !isBlockedStatus &&
    (isCommsContact || isLeadTeamMember) &&
    canRequestDelete &&
    !canDelete;

  const isEditingRef = useRef(false);
  const resyncEditSessionRef = useRef<() => void>(() => {});

  const {
    lock,
    lockState,
    lockedByUsername,
    acquireFailureReason,
    acquire,
    release,
    releaseWithRetry,
    refreshLockFromServer,
    ensureLockForSubmit,
    sendHeartbeat,
    applyExternalLockReleased,
    setLockedByOther,
    clearLockedByOther,
  } = useActivityLock(id, user?.id, {
    onServerLockGone: () => resyncEditSessionRef.current(),
  });

  const {
    isBlocked: isBlockedByRecurringLockout,
    schedule: recurringLockoutSchedule,
  } = useRecurringEditLockout(user?.permissions ?? []);

  const lockoutInlineMessage = useMemo(
    () =>
      recurringLockoutSchedule != null
        ? getRecurringLockoutInlineMessage(recurringLockoutSchedule)
        : '',
    [recurringLockoutSchedule]
  );

  const [isEditing, setIsEditing] = useState(false);
  isEditingRef.current = isEditing;
  const isDirty = form.formState.isDirty;
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;
  const [editRecoveryState, setEditRecoveryState] =
    useState<ActivityEditRecoveryState>(null);
  const editSessionTokenRef = useRef<string | null>(null);
  const wasEditingRef = useRef(false);
  const resyncGenerationRef = useRef(0);

  useEffect(() => {
    if (isEditing && !wasEditingRef.current) {
      editSessionTokenRef.current = getActivityConcurrencyToken(activity);
    } else if (isEditing && !isDirty) {
      editSessionTokenRef.current = getActivityConcurrencyToken(activity);
    } else if (!isEditing) {
      editSessionTokenRef.current = null;
      setEditRecoveryState(null);
    }
    wasEditingRef.current = isEditing;
  }, [activity, isDirty, isEditing]);

  const [forceHandoffPending, setForceHandoffPending] = useState(false);
  const [cancelHandoffPending, setCancelHandoffPending] = useState(false);
  const [handoffAwaitingCompletion, setHandoffAwaitingCompletion] =
    useState(false);
  const handoffAwaitingCompletionRef = useRef(false);
  const handoffToastHandleRef = useRef<LockHandoffToastHandle | null>(null);
  const activityFormRef = useRef<HTMLFormElement>(null);

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
  const isSubmittingRef = useRef(false);
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
   * when an intentional edit-session teardown needs to close internal overlays.
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
    useActivityEditFormHydration(activity, lookups, form, isEditing && isDirty);

  const closeSubmitModals = useCallback(() => {
    setShowConfirmModal(false);
    setShowReviewModal(false);
    setShowCompleteModal(false);
    setValidatedData(null);
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  }, []);

  const { lockoutSubmitGenerationRef } = useRecurringLockoutSession({
    activityId: id,
    isBlockedByRecurringLockout,
    recurringLockoutSchedule,
    permissions: user?.permissions ?? [],
    isEditing,
    lockState,
    form,
    initialFormDataRef,
    setFormUiEpoch,
    setIsEditing,
    applyExternalLockReleased,
    releaseWithRetry,
    refreshActivity,
    closeSubmitModals,
  });

  const updateMutation = useUpdateActivity();
  const deleteMutation = useDeleteActivity();
  const restoreMutation = useRestoreActivity();
  const softDeleteMutation = useSoftDeleteActivity();
  const requestDeleteMutation = useRequestDeleteActivity();
  const syncFlagsMutation = useSyncActivityFlags({
    onSuccess: () => void refreshActivity(),
  });
  const removeAssigneeFlagMutation = useRemoveAssigneeActivityFlag({
    onSuccess: () => void refreshActivity(),
  });
  const unshareMutation = useUnshareActivityTeam();
  const [unshareModalOpen, setUnshareModalOpen] = useState(false);

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

  const activitySocketConnection = useActivityWebSocket(id, {
    onLockAcquired: (lockedBy) => {
      if (user?.id != null && lockedBy.userId === user?.id) {
        const wasHandoff = handoffAwaitingCompletionRef.current;
        setHandoffAwaitingCompletion(false);
        if (wasHandoff) {
          handoffToastHandleRef.current?.dismissLoadingOnly();
        } else {
          handoffToastHandleRef.current?.notifyLockAcquired();
        }
        void refreshLockFromServer().then((next) => {
          if (next === 'owned') {
            setEditRecoveryState(null);
          }
        });
        return;
      }
      applyExternalLockReleased();
      setEditRecoveryState(null);
      setLockedByOther(lockedBy.username);
    },
    onActivitySocketReconnect: () => resyncEditSessionRef.current(),
    onLockReleased: () => {
      if (isSubmittingRef.current) {
        return;
      }
      clearLockedByOther();
      if (isEditingRef.current) {
        resyncEditSessionRef.current();
        return;
      }
      applyExternalLockReleased();
      void refreshActivity();
    },
    onDataUpdated: () => {
      if (isEditingRef.current && isDirtyRef.current) {
        resyncEditSessionRef.current();
      } else {
        void refreshActivity();
      }
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
            { duration: TOAST_DURATION_MS.info }
          );
        } else {
          toast.success('The activity is ready to edit.', {
            id: `lock-handoff-success-${payload.activityId}`,
            duration: TOAST_DURATION_MS.success,
          });
          void refreshLockFromServer();
        }
        return;
      }
      if (payload.outcome === 'aborted_no_holder_lock') {
        toast.warning(
          'Lock transfer could not complete. The activity is no longer held by the original editor.',
          { duration: TOAST_DURATION_MS.error }
        );
      }
    },
  });

  const mayEdit =
    canEditActivity &&
    lockState !== 'locked-by-other' &&
    !isBlockedByRecurringLockout &&
    lockState !== 'checking' &&
    lockState !== 'acquiring' &&
    (!isBlockedStatus || canEditWhenBlocked);

  const handleGoBack = useCallback(() => {
    const fromState = getActivityFormBackTarget(location.state);
    if (fromState != null) {
      void navigate(fromState, {
        replace: true,
        state: buildActivityListScrollRestoreReturnState(location.state, id),
      });
      return;
    }
    if (window.history.length > 1) {
      void navigate(-1);
    } else {
      void navigate('/');
    }
  }, [navigate, location.state, id]);

  const mayEditFormFields =
    canEditActivity && (!isBlockedStatus || canEditWhenBlocked);
  /** Show the Clone button when the user can create and has edit eligibility on the source. Blocked-status gating is already handled by `canEditWhenBlocked` (which requires `activities.delete.any`). */
  const canCloneActivity = canCreateActivity && mayEditFormFields;
  /** True when the user cannot edit for permission/status reasons (not merely waiting on a lock). */
  const isViewOnlyByPermission = !mayEditFormFields;
  const connectionBlocksEditStart = isActivitySocketConnectionBlocked(
    activitySocketConnection
  );
  const isActiveEditSession =
    isEditing || lockState === 'owned' || lockState === 'acquiring';
  const readOnly =
    lockState === 'locked-by-other' ||
    isBlockedByRecurringLockout ||
    !mayEditFormFields ||
    connectionBlocksFieldInputUnlessActiveSession(
      activitySocketConnection,
      isActiveEditSession
    );
  const hasEditLock = lockState === 'owned';
  const isLockedByOther = lockState === 'locked-by-other';
  const showLockoutNotice = isBlockedByRecurringLockout && !isLockedByOther;

  const unsharePermissions = resolveUnsharePermissions(
    hasPermission,
    user?.roleName
  );
  const canUnshareActivity =
    unsharePermissions.hasUnshare || unsharePermissions.hasUnshareAll;
  const eligibleUnshareTeams = useMemo(
    () =>
      getUnshareableTeamsForActivity(
        {
          sharedWithTeamIds: activity.sharedWithTeamIds,
          visibility: activity.visibility,
        },
        lookups.sharedWithTeams,
        user?.teamIds ?? [],
        unsharePermissions.hasUnshare,
        unsharePermissions.hasUnshareAll,
        unsharePermissions.isAdminOrSysAdmin
      ),
    [
      activity.sharedWithTeamIds,
      activity.visibility,
      lookups.sharedWithTeams,
      user?.teamIds,
      unsharePermissions,
    ]
  );
  const showUnshareHeaderAction =
    !canEditActivity && canUnshareActivity && eligibleUnshareTeams.length > 0;
  const unshareDisabled = isLockedByOther || isBlockedByRecurringLockout;
  const unshareDisabledReason = isLockedByOther
    ? 'Cannot unshare while activity is being edited.'
    : isBlockedByRecurringLockout
      ? lockoutInlineMessage || 'Editing is temporarily locked.'
      : undefined;

  const handleUnshareConfirm = useCallback(
    (teamId: number) => {
      const team =
        eligibleUnshareTeams.find((entry) => entry.id === teamId) ?? null;
      unshareMutation.mutate(
        { id, teamId },
        {
          onSuccess: () => {
            const current = form.getValues('sharedWithTeamIds') ?? [];
            form.setValue(
              'sharedWithTeamIds',
              current.filter((entryId) => entryId !== teamId),
              { shouldDirty: false }
            );
            toast.success(`Removed ${team?.name ?? 'team'} from Shared With`);
            setUnshareModalOpen(false);
            void refreshActivity();
          },
          onError: (error) => {
            showErrorToast(
              error,
              `Could not remove ${team?.name ?? 'team'} from Shared With`
            );
          },
        }
      );
    },
    [eligibleUnshareTeams, form, id, refreshActivity, unshareMutation]
  );

  const [lockBannerSentinel, setLockBannerSentinel] =
    useState<HTMLDivElement | null>(null);
  const [lockoutBannerSentinel, setLockoutBannerSentinel] =
    useState<HTMLDivElement | null>(null);
  const lockBannerInView = useElementIsIntersecting(
    lockBannerSentinel,
    isLockedByOther,
    LOCK_BANNER_INTERSECTION_ROOT_MARGIN,
    0
  );
  const lockoutBannerInView = useElementIsIntersecting(
    lockoutBannerSentinel,
    showLockoutNotice,
    LOCK_BANNER_INTERSECTION_ROOT_MARGIN,
    0
  );
  const connectionAlertEligible = shouldShowActivityConnectionAlert({
    mayEditFormFields,
    socketConnection: activitySocketConnection,
    isLockedByOther,
    isBlockedByRecurringLockout,
  });

  const { connectionAlert, notifyResyncOutcome } = useActivityEditConnectionUi({
    activityId: id,
    socketConnection: activitySocketConnection,
    connectionAlertEligible,
    isActiveEditSession,
    editRecoveryState,
  });
  const [connectionAlertPresent, setConnectionAlertPresent] = useState(false);

  const resyncEditSession = useCallback(() => {
    const generation = ++resyncGenerationRef.current;
    void (async () => {
      if (!isEditingRef.current) {
        try {
          await refreshLockFromServer();
          if (generation === resyncGenerationRef.current) {
            notifyResyncOutcome('success');
          }
        } catch {
          if (generation === resyncGenerationRef.current) {
            notifyResyncOutcome('failure');
          }
        }
        return;
      }

      setEditRecoveryState('resyncing');
      try {
        const [latestActivity, serverLockState] = await Promise.all([
          fetchActivity(id),
          refreshLockFromServer(),
        ]);
        if (generation !== resyncGenerationRef.current) return;

        const action = resolveActivityEditResyncAction({
          editSessionToken: editSessionTokenRef.current,
          latestActivity,
          serverLockState,
        });
        if (action === 'continue-owned') {
          setEditRecoveryState(null);
          notifyResyncOutcome('success');
          return;
        }
        if (action === 'server-changed') {
          if (!isDirtyRef.current) {
            editSessionTokenRef.current =
              getActivityConcurrencyToken(latestActivity);
            setEditRecoveryState(null);
            await refreshActivity();
            notifyResyncOutcome('failure');
            return;
          }
          logger.warn(
            'Activity edit session blocked: server version changed while dirty',
            {
              activityId: id,
              previousToken: editSessionTokenRef.current,
              latestToken: getActivityConcurrencyToken(latestActivity),
              serverLockState,
            }
          );
          setEditRecoveryState('server-changed');
          notifyResyncOutcome('failure');
          return;
        }
        if (action === 'blocked-by-other') {
          setEditRecoveryState(null);
          notifyResyncOutcome('failure');
          return;
        }
        if (action === 'retry') {
          setEditRecoveryState('retry');
          notifyResyncOutcome('failure');
          return;
        }

        const acquireResult = await ensureLockForSubmit();
        if (generation !== resyncGenerationRef.current) return;
        if (acquireResult === 'ready') {
          setEditRecoveryState(null);
          notifyResyncOutcome('success');
          return;
        }
        if (acquireResult === 'blocked-by-other') {
          setEditRecoveryState(null);
          notifyResyncOutcome('failure');
          return;
        }
        setEditRecoveryState(acquireResult);
        notifyResyncOutcome('failure');
      } catch {
        if (generation === resyncGenerationRef.current) {
          setEditRecoveryState('retry');
          notifyResyncOutcome('failure');
        }
      }
    })();
  }, [
    ensureLockForSubmit,
    id,
    notifyResyncOutcome,
    refreshActivity,
    refreshLockFromServer,
  ]);

  useEffect(() => {
    resyncEditSessionRef.current = resyncEditSession;
  }, [resyncEditSession]);

  const editSessionActionsBlocked = useMemo(
    () =>
      isActivityEditSessionActionsBlocked(
        activitySocketConnection,
        editRecoveryState
      ),
    [activitySocketConnection, editRecoveryState]
  );

  const shouldWarnBeforeUnload = shouldWarnActivityEditBeforeUnload({
    isDirty,
    isActiveEditSession,
    socketConnection: activitySocketConnection,
    editRecoveryState,
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldWarnBeforeUnload) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldWarnBeforeUnload]);

  const confirmBlockedNoticeByAction = useMemo(() => {
    const forAction = (action: ActivityEditConfirmAction) =>
      getActivityConfirmBlockedNotice(
        action,
        activitySocketConnection,
        editRecoveryState
      );
    return {
      save: forAction('save'),
      review: forAction('review'),
      complete: forAction('complete'),
      delete: forAction('delete'),
      requestDelete: forAction('request-delete'),
      clone: forAction('clone'),
      note: forAction('note'),
    };
  }, [activitySocketConnection, editRecoveryState]);

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
    isBlockedByRecurringLockout: isBlockedByRecurringLockout,
    isDirty,
  });
  const editRecoveryMessage = useMemo(
    () => getActivityEditRecoveryBannerMessage(editRecoveryState),
    [editRecoveryState]
  );

  const reviewModalActivityEndedAtLabel = useMemo(
    () =>
      formatActivityEndDateTimeLabel(
        activity.endDate,
        activity.endTime,
        activity.isAllDay
      ),
    [activity.endDate, activity.endTime, activity.isAllDay]
  );

  const getEditLockAcquireToastMessage = useCallback((): string => {
    if (acquireFailureReason === 'time-lockout') {
      return RECURRING_EDIT_LOCKOUT_UI_MESSAGE;
    }
    return getActivityEditAcquireFailureToastMessage(
      acquireFailureReason,
      lockedByUsername,
      EDIT_LOCK_CONFLICT_TOAST
    );
  }, [acquireFailureReason, lockedByUsername]);

  const notifyEditLockAcquireConflict = useCallback(() => {
    if (
      shouldSuppressAcquireConnectionToast(
        acquireFailureReason,
        activitySocketConnection
      )
    ) {
      return;
    }
    const message = getEditLockAcquireToastMessage();
    if (message.length === 0) {
      return;
    }
    const variant =
      getActivityEditAcquireFailureToastVariant(acquireFailureReason);
    const toastOptions = { duration: TOAST_DURATION_MS.error };
    if (variant === 'warning') {
      toast.warning(message, toastOptions);
    } else {
      toast.error(message, toastOptions);
    }
  }, [
    acquireFailureReason,
    activitySocketConnection,
    getEditLockAcquireToastMessage,
  ]);

  const { tryStartEditSessionFromDirty } = useEditLockIntent({
    formHydrated: isFormHydrated,
    hydrationGeneration,
    mayEdit,
    isEditing,
    setIsEditing,
    acquire,
    lockState,
    form,
    initialFormDataRef,
    onAcquireConflict: notifyEditLockAcquireConflict,
    connectionBlocksEditStart,
  });

  const prevActivitySocketConnectionRef = useRef(activitySocketConnection);
  useEffect(() => {
    const previous = prevActivitySocketConnectionRef.current;
    prevActivitySocketConnectionRef.current = activitySocketConnection;
    if (
      previous !== 'connected' &&
      activitySocketConnection === 'connected' &&
      mayEditFormFields &&
      !isLockedByOther &&
      !isBlockedByRecurringLockout &&
      !isEditing &&
      lockState === 'idle'
    ) {
      tryStartEditSessionFromDirty();
    }
  }, [
    activitySocketConnection,
    isBlockedByRecurringLockout,
    isEditing,
    isLockedByOther,
    lockState,
    mayEditFormFields,
    tryStartEditSessionFromDirty,
  ]);

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
      if (connectionBlocksEditStart) {
        return;
      }
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
          notifyEditLockAcquireConflict();
        }
      });
    },
    [
      connectionBlocksEditStart,
      isEditing,
      acquire,
      notifyEditLockAcquireConflict,
    ]
  );

  const handleConfirmLeave = async () => {
    const shouldReloadLatest = editRecoveryState === 'server-changed';
    setShowLeaveConfirm(false);
    resyncGenerationRef.current += 1;
    setEditRecoveryState(null);
    await release();
    setIsEditing(false);
    if (initialFormDataRef.current) {
      form.reset(initialFormDataRef.current);
    }
    if (shouldReloadLatest) {
      await refreshActivity();
    }
  };

  const onSubmit = (data: ActivityFormData) => {
    setValidatedData(data);
    setShowConfirmModal(true);
  };

  type SubmitActivityMode =
    | {
        kind: 'update';
        validatedData: ActivityFormData;
        notes?: string;
        renewPublicLastUpdated?: boolean;
      }
    | { kind: 'reviewOnly'; notes?: string; renewPublicLastUpdated?: boolean }
    | {
        kind: 'reviewWithSave';
        validatedData: ActivityFormData;
        notes?: string;
        renewPublicLastUpdated?: boolean;
      }
    | {
        kind: 'completeOnly';
        notes?: string;
        renewPublicLastUpdated?: boolean;
      }
    | {
        kind: 'completeWithSave';
        validatedData: ActivityFormData;
        notes?: string;
        renewPublicLastUpdated?: boolean;
      };

  const runSubmitUpdate = useCallback(
    async (mode: SubmitActivityMode) => {
      if (isBlockedByRecurringLockout) {
        return;
      }
      const submitAction: ActivityEditConfirmAction =
        mode.kind === 'update'
          ? 'save'
          : mode.kind === 'reviewOnly' || mode.kind === 'reviewWithSave'
            ? 'review'
            : 'complete';
      const submitBlockedMessage = getActivityConfirmBlockedMessage(
        submitAction,
        activitySocketConnection,
        editRecoveryState
      );
      if (submitBlockedMessage != null) {
        showActionBlockedToast({
          title: getActivitySubmitBlockedToastTitle(submitAction),
          description: submitBlockedMessage,
        });
        return;
      }

      const submitGeneration = lockoutSubmitGenerationRef.current;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      const lockReady = await ensureLockForSubmit();
      if (lockReady !== 'ready') {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        if (lockReady === 'unavailable') {
          showActionBlockedToast({
            title: getActivitySubmitBlockedToastTitle(submitAction),
            description:
              'Cannot reach the server. Check your connection and try again.',
            variant: 'warning',
          });
        } else if (lockReady === 'blocked-by-other') {
          showActionBlockedToast({
            title: getActivitySubmitBlockedToastTitle(submitAction),
            description: 'This activity is being edited by another user.',
            variant: 'warning',
          });
        } else if (lockReady === 'time-lockout') {
          showActionBlockedToast({
            title: getActivitySubmitBlockedToastTitle(submitAction),
            description: RECURRING_EDIT_LOCKOUT_UI_MESSAGE,
            variant: 'warning',
          });
        } else if (lockReady === 'unauthorized') {
          showActionBlockedToast({
            title: getActivitySubmitBlockedToastTitle(submitAction),
            description:
              'Your session or permissions no longer allow this update. Sign in again and retry.',
            variant: 'error',
          });
        } else if (lockReady === 'server-error') {
          showActionBlockedToast({
            title: getActivitySubmitBlockedToastTitle(submitAction),
            description:
              'The server could not verify the edit lock. Please try again.',
            variant: 'error',
          });
        } else {
          showActionBlockedToast({
            title: getActivitySubmitBlockedToastTitle(submitAction),
            description:
              'You must acquire an edit lock before updating this activity.',
            variant: 'warning',
          });
        }
        return;
      }
      try {
        let submitData: UpdateActivityRequest;

        const renewField =
          mode.renewPublicLastUpdated === true
            ? { renewPublicLastUpdated: true as const }
            : {};

        if (mode.kind === 'reviewOnly') {
          submitData = {
            ...buildMarkReviewedOnlyPayload(mode.notes),
            ...renewField,
          };
        } else if (mode.kind === 'completeOnly') {
          submitData = {
            markAsCompleted: true,
            ...(mode.notes ? { activityHistoryNotes: mode.notes } : {}),
            ...renewField,
          };
        } else {
          const opts: UpdatePayloadOptions =
            mode.kind === 'reviewWithSave'
              ? {
                  markAsReviewed: true,
                  requiredTranslationStatusId,
                  includeRepresentatives:
                    !!form.formState.dirtyFields.representatives,
                  includeSharedWithTeamIds:
                    !!form.formState.dirtyFields.sharedWithTeamIds,
                }
              : mode.kind === 'completeWithSave'
                ? {
                    markAsCompleted: true,
                    requiredTranslationStatusId,
                    includeRepresentatives:
                      !!form.formState.dirtyFields.representatives,
                    includeSharedWithTeamIds:
                      !!form.formState.dirtyFields.sharedWithTeamIds,
                  }
                : {
                    requiredTranslationStatusId,
                    includeRepresentatives:
                      !!form.formState.dirtyFields.representatives,
                    includeSharedWithTeamIds:
                      !!form.formState.dirtyFields.sharedWithTeamIds,
                  };
          submitData = {
            ...buildPayloadForUpdate(
              mode.validatedData,
              form.getValues(),
              opts
            ),
            ...(mode.notes ? { activityHistoryNotes: mode.notes } : {}),
            ...renewField,
          };
        }

        const concurrencyToken = getActivityConcurrencyToken({
          lastUpdatedDateTime: activity.lastUpdatedDateTime,
          publicLastUpdatedDateTime: activity.publicLastUpdatedDateTime,
        });
        if (concurrencyToken) {
          submitData = {
            ...submitData,
            ifUnmodifiedSince: concurrencyToken,
          };
        }

        const updated = await updateMutation.mutateAsync({
          id,
          data: submitData,
        });
        if (submitGeneration !== lockoutSubmitGenerationRef.current) {
          return;
        }
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
        if (submitGeneration !== lockoutSubmitGenerationRef.current) {
          return;
        }
        logger.error('Failed to update activity', err);
        // Backend detail already distinguishes no-lock-held vs locked-by-other (423) cases.
        const message = getRecurringEditLockoutErrorMessage(err);
        showErrorToast(err, message);
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        if (submitGeneration === lockoutSubmitGenerationRef.current) {
          setShowConfirmModal(false);
          setShowReviewModal(false);
          setShowCompleteModal(false);
          setValidatedData(null);
        }
      }
    },
    [
      id,
      updateMutation,
      form,
      activity.title,
      activity.lastUpdatedDateTime,
      activity.publicLastUpdatedDateTime,
      canViewActivity,
      applyExternalLockReleased,
      navigate,
      requiredTranslationStatusId,
      isBlockedByRecurringLockout,
      lockoutSubmitGenerationRef,
      ensureLockForSubmit,
      activitySocketConnection,
      editRecoveryState,
    ]
  );

  const handleConfirmedSubmit = async (
    payload: import('@/components/activity/activities/EditActivityConfirmModal').ActivitySaveConfirmPayload
  ) => {
    if (!validatedData) return;
    await runSubmitUpdate({
      kind: 'update',
      validatedData,
      notes: payload.notes,
      renewPublicLastUpdated: payload.renewPublicLastUpdated,
    });
  };

  const onError = (errors: FieldErrors<ActivityFormData>) => {
    logger.error('Form validation failed');
    focusFirstInvalidField(errors, {
      getFieldLabel: getActivityFieldLabel,
      fieldOrder: getActivityFormSectionFieldKeys(),
      root: activityFormRef.current,
    });
    const detail =
      missingFields.length > 0
        ? `Required fields missing: ${missingFields.join(', ')}`
        : 'Please fix the validation errors and try again.';
    toast.error('Submission failed', {
      description: detail,
      duration: TOAST_DURATION_MS.error,
    });
  };

  const handleReviewConfirm = async (
    payload: import('@/components/activity/activities/ReviewActivityModal').ReviewActivityConfirmPayload
  ) => {
    const { notes, markAsCompleted, unassignMe, renewPublicLastUpdated } =
      payload;
    if (unassignMe && user?.id != null) {
      const myFlags = (activity.flags ?? []).filter(
        (flag) => flag.assigneeId === user.id
      );

      const results = await Promise.allSettled(
        myFlags.map((flag) =>
          removeAssigneeFlagMutation.mutateAsync({
            activityId: id,
            teamId: flag.teamId,
            assigneeId: flag.assigneeId,
            assigneeName: flag.assigneeName,
            suppressSuccessToast: true,
          })
        )
      );

      const fulfilled = results.filter(
        (result) => result.status === 'fulfilled'
      );
      const rejected = results.filter((result) => result.status === 'rejected');

      if (fulfilled.length > 0) {
        toast.success(
          fulfilled.length === 1
            ? 'Activity unassigned'
            : `Activity unassigned from ${fulfilled.length} teams`
        );
      }

      if (rejected.length > 0) {
        if (fulfilled.length > 0) {
          toast.error(
            rejected.length === 1
              ? 'Failed to unassign from 1 team'
              : `Failed to unassign from ${rejected.length} teams`
          );
        } else {
          toast.error('Failed to unassign activity');
        }
      }
    }
    if (markAsCompleted) {
      if (isDirty) {
        await form.handleSubmit(async (data) => {
          await runSubmitUpdate({
            kind: 'completeWithSave',
            validatedData: data,
            notes,
            renewPublicLastUpdated,
          });
        }, onError)();
      } else {
        await runSubmitUpdate({
          kind: 'completeOnly',
          notes,
          renewPublicLastUpdated,
        });
      }
      return;
    }
    if (isDirty) {
      await form.handleSubmit(async (data) => {
        await runSubmitUpdate({
          kind: 'reviewWithSave',
          validatedData: data,
          notes,
          renewPublicLastUpdated,
        });
      }, onError)();
    } else {
      await runSubmitUpdate({
        kind: 'reviewOnly',
        notes,
        renewPublicLastUpdated,
      });
    }
  };

  const handleCompleteConfirm = async (
    payload: import('@/components/activity/activities/EditActivityConfirmModal').ActivitySaveConfirmPayload
  ) => {
    const { notes, renewPublicLastUpdated } = payload;
    if (isDirty) {
      await form.handleSubmit(async (data) => {
        await runSubmitUpdate({
          kind: 'completeWithSave',
          validatedData: data,
          notes,
          renewPublicLastUpdated,
        });
      }, onError)();
    } else {
      await runSubmitUpdate({
        kind: 'completeOnly',
        notes,
        renewPublicLastUpdated,
      });
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
        getRecurringEditLockoutErrorMessage(err) ??
        (err instanceof ApiError && err.status === 403
          ? 'You do not have permission to delete this activity'
          : undefined);
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
        getRecurringEditLockoutErrorMessage(err) ??
        (err instanceof ApiError && err.status === 403
          ? 'You do not have permission to delete this activity'
          : undefined);
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

  const reviewModalChanges =
    showReviewModal && initialFormDataRef.current
      ? computeFormChanges(initialFormDataRef.current, form.getValues())
      : [];

  const displayId =
    activity.displayId ??
    buildActivityDisplayId(TEAM_PREFIX_FALLBACK, activity.id);
  const categories = activity.category ?? [];

  return (
    <ErrorBoundary FallbackComponent={FormErrorFallback}>
      <ActivityConnectionStatusAlert
        display={connectionAlert}
        onPresentChange={setConnectionAlertPresent}
      />
      <ActivityFormStickyHeader
        onBack={handleGoBack}
        lockStrip={
          connectionAlertPresent ? undefined : isLockedByOther ? (
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
          ) : showLockoutNotice ? (
            <LockoutBannerContent
              message={lockoutInlineMessage}
              className="max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1"
            />
          ) : undefined
        }
        lockStripVisible={
          !connectionAlertPresent &&
          ((isLockedByOther && !lockBannerInView) ||
            (showLockoutNotice && !lockoutBannerInView))
        }
      />
      <ActivityPageHeader
        displayId={displayId}
        currentUserId={user?.id ?? null}
        title={activity.title ?? ''}
        categories={categories}
        leadMinistry={activity.leadMinistry ?? null}
        activityStatus={activity.activityStatus ?? null}
        lastUpdatedDateTime={activity.publicLastUpdatedDateTime ?? null}
        adminOperationalLastUpdatedDateTime={
          activity.lastUpdatedDateTime ?? null
        }
        showAdminOperationalTimestamp={hasPermission(
          PERMISSIONS.ACTIVITIES.PUBLIC_LAST_UPDATED_DEFER
        )}
        createdDateTime={activity.createdDateTime ?? null}
        onHistoryClick={() => setHistoryOpen(true)}
        flags={activity.flags ?? []}
        canFlag={canFlag}
        onFlagSync={
          canFlag
            ? (
                teamId,
                assigneeIds,
                note,
                assigneeNames,
                displayTeamPerAssignee
              ) =>
                syncFlagsMutation.mutate({
                  activityId: id,
                  body: { teamId, assigneeIds, note, displayTeamPerAssignee },
                  assigneeNames,
                })
            : undefined
        }
        onFlagUnassign={(teamId, assigneeId, assigneeName) =>
          removeAssigneeFlagMutation.mutate({
            activityId: id,
            teamId,
            assigneeId,
            assigneeName,
          })
        }
        isFlagPending={
          syncFlagsMutation.isPending || removeAssigneeFlagMutation.isPending
        }
        isFavourite={isFavourite(id)}
        onFavouriteToggle={() => toggleFavourite(id)}
        isFavouriteToggling={isFavouriteToggling}
        sharedWith={activity.sharedWith ?? []}
        visibility={activity.visibility}
        leadTeamDisplayName={activity.leadTeamDisplayName ?? null}
        unshareAction={
          showUnshareHeaderAction
            ? {
                teamLabel:
                  eligibleUnshareTeams.length === 1
                    ? eligibleUnshareTeams[0].name
                    : '…',
                disabled: unshareDisabled,
                disabledReason: unshareDisabledReason,
                onClick: () => setUnshareModalOpen(true),
                isPending: unshareMutation.isPending,
              }
            : undefined
        }
      />
      <UnshareActivityModal
        open={unshareModalOpen}
        onOpenChange={setUnshareModalOpen}
        mode="single"
        activityIds={[id]}
        activities={[
          {
            sharedWithTeamIds: activity.sharedWithTeamIds,
            visibility: activity.visibility,
          },
        ]}
        eligibleTeams={eligibleUnshareTeams}
        onConfirm={handleUnshareConfirm}
        isPending={unshareMutation.isPending}
      />
      {editRecoveryMessage != null && (
        <div
          className="bg-muted border-border mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm"
          role="alert"
        >
          <span>{editRecoveryMessage}</span>
          {editRecoveryState === 'server-changed' ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLeaveConfirm(true)}
            >
              Discard and reload
            </Button>
          ) : editRecoveryState !== 'resyncing' ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => resyncEditSessionRef.current()}
            >
              Retry
            </Button>
          ) : null}
        </div>
      )}
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
      {showLockoutNotice && (
        <div ref={setLockoutBannerSentinel}>
          <LockoutBanner
            inert={!lockoutBannerInView}
            message={lockoutInlineMessage}
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
          ref={activityFormRef}
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
            activityId={id}
            readOnly={readOnly}
            showFieldChangeHighlights={canReviewActivities}
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
                    disabled={
                      isSubmitting ||
                      actionFlags.isEditingBlocked ||
                      editSessionActionsBlocked
                    }
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
                    disabled={
                      isSubmitting ||
                      actionFlags.isEditingBlocked ||
                      editSessionActionsBlocked
                    }
                  >
                    Delete
                  </Button>
                )}
                <DiscardChangesButton
                  control={form.control}
                  getValues={form.getValues}
                  initialFormData={initialFormDataRef.current}
                  isDirty={isDirty}
                  isSubmitting={isSubmitting}
                  onClick={() => setShowLeaveConfirm(true)}
                />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-4">
              {missingFieldsHelperText != null && (
                <ActivityFormMissingFieldsHint
                  helperText={missingFieldsHelperText}
                  fields={missingFieldItems}
                  onFieldSelect={(fieldName) =>
                    focusRequiredField(fieldName, {
                      root: activityFormRef.current,
                    })
                  }
                />
              )}
              {canCloneActivity && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCloneModal(true)}
                  disabled={
                    isSubmitting ||
                    actionFlags.isEditingBlocked ||
                    isDirty ||
                    connectionBlocksEditStart
                  }
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
                disabled={
                  !actionFlags.canSubmitUpdate || editSessionActionsBlocked
                }
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
              {actionFlags.showReviewAction && (
                <Button
                  type="button"
                  aria-label={isDirty ? 'Save and Review' : 'Review'}
                  disabled={
                    !actionFlags.reviewActionEnabled ||
                    editSessionActionsBlocked
                  }
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
                    disabled={
                      !actionFlags.completeActionEnabled ||
                      editSessionActionsBlocked
                    }
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
        displayId={displayId}
        open={historyOpen}
        onOpenChange={(v) => setHistoryOpen(!!v)}
        dateStatuses={lookups.dateStatuses}
        venueStatuses={lookups.venueStatuses}
        canAddNote={mayEditFormFields}
        addNoteDisabled={isLockedByOther || isBlockedByRecurringLockout}
        addNoteDisabledReason={
          isLockedByOther
            ? 'Cannot add note. Activity is being edited by another user.'
            : isBlockedByRecurringLockout
              ? lockoutInlineMessage || 'Editing is temporarily locked.'
              : undefined
        }
        noteConfirmBlockedNotice={confirmBlockedNoticeByAction.note}
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
        onConfirm={(payload) => void handleConfirmedSubmit(payload)}
        isSubmitting={isSubmitting}
        confirmDisabled={editSessionActionsBlocked}
        confirmBlockedNotice={confirmBlockedNoticeByAction.save}
      />
      <ReviewActivityModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        changes={reviewModalChanges}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onConfirm={(payload) => void handleReviewConfirm(payload)}
        displayId={displayId}
        showMarkAsCompletedOption={actionFlags.showCompleteAction}
        activityEndedAtLabel={reviewModalActivityEndedAtLabel}
        showUnassignMeOption={(activity.flags ?? []).some(
          (f) => f.assigneeId === user?.id
        )}
        confirmDisabled={editSessionActionsBlocked}
        confirmBlockedNotice={confirmBlockedNoticeByAction.review}
      />
      <CompleteActivityModal
        open={showCompleteModal}
        onOpenChange={setShowCompleteModal}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onConfirm={(payload) => void handleCompleteConfirm(payload)}
        displayId={displayId}
        confirmDisabled={editSessionActionsBlocked}
        confirmBlockedNotice={confirmBlockedNoticeByAction.complete}
      />
      <RequestDeleteActivityModal
        open={showRequestDeleteModal}
        onOpenChange={setShowRequestDeleteModal}
        onConfirm={handleRequestDeleteConfirm}
        isSubmitting={isRequestDeleteSubmitting}
        confirmDisabled={editSessionActionsBlocked}
        confirmBlockedNotice={confirmBlockedNoticeByAction.requestDelete}
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
        confirmBlockedNotice={confirmBlockedNoticeByAction.clone}
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
        confirmDisabled={editSessionActionsBlocked}
        confirmBlockedNotice={confirmBlockedNoticeByAction.delete}
      />
    </ErrorBoundary>
  );
}
