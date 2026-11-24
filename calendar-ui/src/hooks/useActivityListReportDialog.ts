import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo } from 'react';

import {
  ACTIVITY_LIST_REPORT_NAMES,
  isActivityListReportName,
  URL_PARAM_ACTIVITY_LIST_REPORT,
  type ActivityListReportName,
} from '@/lib/activity-list-report-params';

export function useActivityListReportDialog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeReportName = useMemo(() => {
    const raw = searchParams.get(URL_PARAM_ACTIVITY_LIST_REPORT)?.trim();
    return isActivityListReportName(raw) ? raw : null;
  }, [searchParams]);

  const isOpen = activeReportName != null;

  const closeReport = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(URL_PARAM_ACTIVITY_LIST_REPORT);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  useEffect(() => {
    const raw = searchParams.get(URL_PARAM_ACTIVITY_LIST_REPORT)?.trim();
    if (raw && !isActivityListReportName(raw)) {
      closeReport();
    }
  }, [searchParams, closeReport]);

  const openReport = useCallback(
    (reportName: ActivityListReportName) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(URL_PARAM_ACTIVITY_LIST_REPORT, reportName);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeReport();
    },
    [closeReport]
  );

  return {
    activeReportName,
    isOpen,
    openReport,
    closeReport,
    onOpenChange,
    allowedReportNames: ACTIVITY_LIST_REPORT_NAMES,
  };
}
