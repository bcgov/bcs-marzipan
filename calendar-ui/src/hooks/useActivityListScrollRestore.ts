import {
  NavigationType,
  useNavigationType,
  type Location,
  type NavigateFunction,
} from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react';

import { activityFormLinkState } from '@/lib/activity-form-navigation-state';
import {
  ACTIVITY_LIST_SCROLL_STATE_KEY,
  clearStoredActivityListScrollState,
  clearStrictModeScrollRestoreFallback,
  hasPendingActivityListScrollRestore,
  recordScrollRestoreDebug,
  resolveActivityListScrollRestorePending,
  stashStrictModeScrollRestoreFallback,
  takeStrictModeScrollRestoreFallback,
  writeStoredActivityListScrollState,
  type ActivityListScrollRestorePending,
  type StoredActivityListScrollState,
} from '@/lib/activity-list-scroll-restore';

const MAX_RESTORE_ATTEMPTS = 90;

type UseActivityListScrollRestoreOptions = {
  enabled: boolean;
  location: Location;
  navigate: NavigateFunction;
  scrollRef: RefObject<HTMLDivElement | null>;
  pageIndex: number;
  setPageIndex: (index: number) => void;
  pageSize: number;
  loading: boolean;
  sortedActivityIds: number[];
};

function computeRowScrollTarget(
  scrollContainer: HTMLElement,
  activityId: number
): number | null {
  const rowElement = scrollContainer.querySelector<HTMLElement>(
    `[data-activity-id="${activityId}"]`
  );
  if (rowElement == null) return null;
  return Math.max(
    0,
    rowElement.offsetTop - Math.floor(scrollContainer.clientHeight * 0.35)
  );
}

export function useActivityListScrollRestore({
  enabled,
  location,
  navigate,
  scrollRef,
  pageIndex,
  setPageIndex,
  pageSize,
  loading,
  sortedActivityIds,
}: UseActivityListScrollRestoreOptions): {
  openActivityWithScroll: (activityId: number) => void;
} {
  const navigationType = useNavigationType();
  const latestContainerScrollTopRef = useRef(0);
  const pendingRef = useRef<ActivityListScrollRestorePending | null>(null);
  const restoreCompletedRef = useRef(false);
  const allowSessionStorageFallback = navigationType === NavigationType.Pop;

  useEffect(() => {
    if (!enabled) {
      pendingRef.current = null;
      restoreCompletedRef.current = false;
      clearStrictModeScrollRestoreFallback();
    }
  }, [enabled]);

  useLayoutEffect(() => {
    if (!enabled || restoreCompletedRef.current) return;

    const strictFallback = takeStrictModeScrollRestoreFallback();
    if (strictFallback != null) {
      pendingRef.current = strictFallback;
      recordScrollRestoreDebug('pending set', {
        source: 'strictModeFallback',
        focusActivityId: strictFallback.focusActivityId,
        pageIndex: strictFallback.pageIndex,
        container: strictFallback.containerScrollTop,
        window: strictFallback.windowScrollTop,
        hasState: location.state != null,
        pathname: location.pathname,
      });
      return;
    }

    const storageRaw =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(ACTIVITY_LIST_SCROLL_STATE_KEY)
        : null;
    const resolved = resolveActivityListScrollRestorePending(
      location.state,
      storageRaw,
      { allowSessionStorageFallback }
    );

    if (resolved == null) {
      pendingRef.current = null;
      if (!allowSessionStorageFallback && storageRaw != null) {
        clearStoredActivityListScrollState();
      }
      return;
    }

    pendingRef.current = resolved.pending;
    recordScrollRestoreDebug('pending set', {
      source: resolved.source,
      focusActivityId: resolved.pending.focusActivityId,
      pageIndex: resolved.pending.pageIndex,
      container: resolved.pending.containerScrollTop,
      window: resolved.pending.windowScrollTop,
      hasState: location.state != null,
      pathname: location.pathname,
    });
  }, [allowSessionStorageFallback, enabled, location]);

  useEffect(() => {
    if (!enabled) return;

    const scrollContainer = scrollRef.current;
    if (scrollContainer == null) return;

    let rafId = 0;
    let pending = false;

    const persistScroll = () => {
      pending = false;
      const scrollTop = scrollContainer.scrollTop;
      latestContainerScrollTopRef.current = scrollTop;
      if (restoreCompletedRef.current) return;
      writeStoredActivityListScrollState({
        activityListPageIndex: pageIndex,
        activityListScrollTop: scrollTop,
      });
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafId = window.requestAnimationFrame(persistScroll);
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [enabled, pageIndex, scrollRef]);

  useEffect(() => {
    if (!enabled || restoreCompletedRef.current) return;
    if (pendingRef.current != null) return;

    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    latestContainerScrollTopRef.current = scrollTop;
    writeStoredActivityListScrollState({
      activityListPageIndex: pageIndex,
      activityListScrollTop: scrollTop,
    });
  }, [enabled, pageIndex, scrollRef]);

  useEffect(() => {
    if (!enabled) return;

    const pending = pendingRef.current;
    if (pending == null || !hasPendingActivityListScrollRestore(pending)) {
      return;
    }

    const {
      focusActivityId: targetActivityId,
      pageIndex: targetPageIndex,
      containerScrollTop: targetContainer,
      windowScrollTop: targetWindow,
    } = pending;

    if (targetPageIndex == null && targetActivityId != null && pageSize > 0) {
      const targetSortedIndex = sortedActivityIds.indexOf(targetActivityId);
      if (targetSortedIndex >= 0) {
        const derivedPageIndex = Math.floor(targetSortedIndex / pageSize);
        if (pageIndex !== derivedPageIndex) {
          setPageIndex(derivedPageIndex);
          return;
        }
      }
    }

    if (targetPageIndex != null && pageIndex !== targetPageIndex) {
      setPageIndex(targetPageIndex);
      return;
    }

    if (loading || sortedActivityIds.length === 0) return;
    if (typeof window === 'undefined') return;

    const previousScrollRestoration =
      'scrollRestoration' in window.history
        ? window.history.scrollRestoration
        : null;
    const restoreScrollRestoration = () => {
      if (previousScrollRestoration == null) return;
      window.history.scrollRestoration = previousScrollRestoration;
    };

    if (previousScrollRestoration != null) {
      window.history.scrollRestoration = 'manual';
    }

    recordScrollRestoreDebug('begin restore', {
      targetActivityId,
      targetPageIndex,
      pageIndex,
      targetContainer,
      targetWindow,
      rows: sortedActivityIds.length,
    });

    let cancelled = false;
    let rafLoopId = 0;
    let attempts = 0;

    const finishRestore = () => {
      restoreScrollRestoration();
      const completedPending = pendingRef.current;
      if (completedPending != null) {
        stashStrictModeScrollRestoreFallback(completedPending);
      }
      pendingRef.current = null;
      restoreCompletedRef.current = true;
      clearStoredActivityListScrollState();

      void navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
        { replace: true, state: null }
      );
    };

    const step = () => {
      if (cancelled) return;

      const scrollContainer = scrollRef.current;
      const rowTargetFromActivity =
        scrollContainer != null && targetActivityId != null
          ? computeRowScrollTarget(scrollContainer, targetActivityId)
          : null;
      const effectiveContainerTarget =
        targetContainer ?? rowTargetFromActivity ?? null;

      if (
        scrollContainer != null &&
        effectiveContainerTarget != null &&
        scrollContainer.scrollTop !== effectiveContainerTarget
      ) {
        scrollContainer.scrollTop = effectiveContainerTarget;
      }
      if (targetWindow != null && window.scrollY !== targetWindow) {
        window.scrollTo(0, targetWindow);
      }

      attempts += 1;

      const needsContainerScroll =
        targetContainer != null || targetActivityId != null;
      const containerReached = needsContainerScroll
        ? effectiveContainerTarget != null &&
          scrollContainer != null &&
          Math.abs(scrollContainer.scrollTop - effectiveContainerTarget) <= 1
        : true;

      const windowReached =
        targetWindow == null || Math.abs(window.scrollY - targetWindow) <= 1;

      if (attempts === 1 || attempts % 20 === 0) {
        recordScrollRestoreDebug('attempt', {
          attempts,
          target: effectiveContainerTarget,
          rowTargetFromActivity,
          targetActivityId,
          actual: scrollContainer?.scrollTop,
          scrollHeight: scrollContainer?.scrollHeight,
          clientHeight: scrollContainer?.clientHeight,
          hasContainer: scrollContainer != null,
        });
      }

      if (
        (containerReached && windowReached) ||
        attempts >= MAX_RESTORE_ATTEMPTS
      ) {
        recordScrollRestoreDebug('done', {
          attempts,
          containerReached,
          windowReached,
          targetActivityId,
          pageIndex,
          finalScrollTop: scrollContainer?.scrollTop,
        });
        finishRestore();
        return;
      }

      rafLoopId = window.requestAnimationFrame(step);
    };

    rafLoopId = window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafLoopId);
      restoreScrollRestoration();
    };
  }, [
    enabled,
    loading,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    pageIndex,
    pageSize,
    scrollRef,
    setPageIndex,
    sortedActivityIds,
  ]);

  const openActivityWithScroll = useCallback(
    (activityId: number) => {
      restoreCompletedRef.current = false;
      pendingRef.current = null;
      clearStrictModeScrollRestoreFallback();

      const containerScrollTop = scrollRef.current?.scrollTop ?? 0;
      latestContainerScrollTopRef.current = containerScrollTop;
      const windowScrollTop =
        typeof window !== 'undefined' ? window.scrollY : 0;

      const scrollState = {
        activityListPageIndex: pageIndex,
        activityListScrollTop:
          latestContainerScrollTopRef.current ?? containerScrollTop,
        activityListWindowScrollTop: windowScrollTop,
        activityListFocusActivityId: activityId,
      } satisfies StoredActivityListScrollState;

      writeStoredActivityListScrollState(scrollState);
      recordScrollRestoreDebug('capture', scrollState);

      void navigate(
        `/activity/${activityId}`,
        activityFormLinkState(
          location,
          containerScrollTop,
          windowScrollTop,
          pageIndex,
          activityId
        )
      );
    },
    [location, navigate, pageIndex, scrollRef]
  );

  return { openActivityWithScroll };
}
