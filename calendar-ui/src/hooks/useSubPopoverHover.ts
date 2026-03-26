import {
  useCallback,
  useEffect,
  useRef,
  type PointerEventHandler,
} from 'react';

export interface UseSubPopoverHoverOptions {
  /** Delay (ms) before opening on trigger hover. Default 150. */
  openDelayMs?: number;
  /** Delay (ms) before closing after pointer leaves trigger and content. Default 150. */
  closeDelayMs?: number;
}

export interface UseSubPopoverHoverReturn {
  /** Use for Popover onOpenChange. Tracks open source so hover-close only runs when opened by hover. */
  onOpenChange: (open: boolean) => void;
  /** Attach to the PopoverTrigger (e.g. on a wrapper div or the trigger button). */
  triggerPointerHandlers: {
    onPointerEnter: PointerEventHandler;
    onPointerLeave: PointerEventHandler;
  };
  /** Attach to a wrapper inside PopoverContent so leaving to the content doesn't close. */
  contentPointerHandlers: {
    onPointerEnter: PointerEventHandler;
    onPointerLeave: PointerEventHandler;
  };
}

/**
 * Hook for sub-popovers that open on hover (mouse) while keeping keyboard behavior unchanged.
 * - Mouse: trigger hover opens after openDelayMs; leaving trigger and content closes after closeDelayMs.
 * - Keyboard: unchanged (focus + Enter/Space opens, Escape closes); hover-close is not applied when opened by click/keyboard.
 * Use for filter sub-menus (e.g. Translations languages, Leads sections). Do not use for calendar/date picker popovers.
 */
export function useSubPopoverHover(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  options?: UseSubPopoverHoverOptions
): UseSubPopoverHoverReturn {
  const openDelayMs = options?.openDelayMs ?? 150;
  const closeDelayMs = options?.closeDelayMs ?? 150;

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHoverRef = useRef(false);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current != null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearOpenTimer, clearCloseTimer]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) openedByHoverRef.current = false;
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const onTriggerPointerEnter = useCallback(() => {
    clearCloseTimer();
    if (open) return;
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      onOpenChange(true);
      openedByHoverRef.current = true;
    }, openDelayMs);
  }, [open, onOpenChange, openDelayMs, clearCloseTimer]);

  const onTriggerPointerLeave = useCallback(() => {
    clearOpenTimer();
    if (!open) return;
    if (!openedByHoverRef.current) return;
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onOpenChange(false);
    }, closeDelayMs);
  }, [open, onOpenChange, closeDelayMs, clearOpenTimer]);

  const onContentPointerEnter = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const onContentPointerLeave = useCallback(() => {
    if (!open) return;
    if (!openedByHoverRef.current) return;
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onOpenChange(false);
    }, closeDelayMs);
  }, [open, onOpenChange, closeDelayMs]);

  return {
    onOpenChange: handleOpenChange,
    triggerPointerHandlers: {
      onPointerEnter: onTriggerPointerEnter,
      onPointerLeave: onTriggerPointerLeave,
    },
    contentPointerHandlers: {
      onPointerEnter: onContentPointerEnter,
      onPointerLeave: onContentPointerLeave,
    },
  };
}
