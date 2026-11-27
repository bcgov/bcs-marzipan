import { ChevronDown, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { TeamListItem } from '@corpcal/shared/api/types';
import {
  ActivityTable,
  type ActivityTableActiveSavedFilter,
} from '@/components/activity/ActivityTable';
import { PageHeader } from '@/components/layout';
import { ActivityListReportDialog } from '@/components/reports/ActivityListReportDialog';
import { ActivityListReportsMenu } from '@/components/reports/ActivityListReportsMenu';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActivityListReportDialog } from '@/hooks/useActivityListReportDialog';
import { useActivityTablePreferences } from '@/hooks/useActivityTablePreferences';
import { useAuth } from '@/hooks/useAuth';
import { useFavourites } from '@/hooks/useFavourites';
import { useLeadTeamOptions } from '@/hooks/useLeadTeamOptions';
import { useMinistries, useReports } from '@/hooks/useLookups';
import { activityFormLinkState } from '@/lib/activity-form-navigation-state';
import {
  activityListTabServerScopeToTableProps,
  buildActivityListEffectiveScope,
  buildActivityListTabServerScope,
} from '@/lib/activity-list-effective-scope';
import { ACTIVITY_LIST_REPORT_NAMES } from '@/lib/activity-list-report-params';
import {
  getStoredActivityListTab,
  setStoredActivityListTab,
  type ActivityListTabValue,
} from '@/lib/activity-list-tabs';
import { hasMinistryTabLeadTeamFilterConflict } from '@/lib/ministry-tab-lead-filter-conflict';
import { cn } from '@/lib/utils';

const ACTIVITY_LIST_REPORT_NAME_SET = new Set<string>(
  ACTIVITY_LIST_REPORT_NAMES
);

/**
 * Activity list. Rendered inside Layout, which wraps content with
 * the shared PageContainer (max-width, padding) so this page fits viewport width.
 * Tabs filter the list: All, ministry lead team, My activities, Shared with us, and scoped views.
 */
export const ActivityListPage = () => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);
  const canManageFavourites = hasPermission(PERMISSIONS.FAVOURITES.MANAGE);
  const canViewReports = hasPermission(PERMISSIONS.REPORTS.VIEW);
  const canViewLookAhead = hasPermission(PERMISSIONS.LOOK_AHEAD.VIEW);

  const canViewDeleted = hasPermission(PERMISSIONS.ACTIVITIES.VIEW_DELETED);

  const { preferences: listPreferences } = useActivityTablePreferences();
  const { data: reports = [] } = useReports();
  const activityListReports = useMemo(
    () => reports.filter((r) => ACTIVITY_LIST_REPORT_NAME_SET.has(r.name)),
    [reports]
  );

  const {
    activeReportName,
    isOpen: isReportDialogOpen,
    openReport,
    closeReport,
    onOpenChange: onReportDialogOpenChange,
  } = useActivityListReportDialog();

  const [activeTab, setActiveTab] = useState<ActivityListTabValue>('all');
  const initialTabAppliedRef = useRef(false);
  const [selectedLeadTeamId, setSelectedLeadTeamId] = useState<number | null>(
    null
  );
  const [activeSavedFilter, setActiveSavedFilter] =
    useState<ActivityTableActiveSavedFilter | null>(null);

  const { data: leadTeamOptions = [] } = useLeadTeamOptions(true);
  const { data: ministries = [] } = useMinistries();
  const { favouriteActivityIds } = useFavourites();

  const userTeamIds = useMemo(() => user?.teamIds ?? [], [user?.teamIds]);
  const userTeams = useMemo(
    () => leadTeamOptions.filter((t) => userTeamIds.includes(t.id)),
    [leadTeamOptions, userTeamIds]
  );
  const teamsWithMinistry = useMemo(
    () =>
      userTeams.filter(
        (t): t is TeamListItem & { primaryOrganizationId: number } =>
          t.primaryOrganizationId != null
      ),
    [userTeams]
  );

  const showMinistryTab = teamsWithMinistry.length > 0;

  useEffect(() => {
    if (initialTabAppliedRef.current) return;
    initialTabAppliedRef.current = true;

    const stored = getStoredActivityListTab();
    if (stored !== null) {
      if (stored === 'ministry' && !showMinistryTab) {
        setActiveTab('all');
        setStoredActivityListTab('all');
      } else if (stored === 'favourites' && !canManageFavourites) {
        setActiveTab('all');
        setStoredActivityListTab('all');
      } else {
        setActiveTab(stored);
      }
      return;
    }

    const defaultTab: ActivityListTabValue = showMinistryTab
      ? 'my-activities'
      : 'all';
    setActiveTab(defaultTab);
    setStoredActivityListTab(defaultTab);
  }, [canManageFavourites, showMinistryTab]);

  useEffect(() => {
    if (activeTab === 'favourites' && !canManageFavourites) {
      setActiveTab('all');
      setStoredActivityListTab('all');
    }
  }, [activeTab, canManageFavourites]);

  const ministryAbbreviationByMinistryId = useMemo(() => {
    const map = new Map<number, string>();
    ministries.forEach((m) => {
      if (m.abbreviation != null) map.set(m.id, m.abbreviation);
    });
    return map;
  }, [ministries]);

  const selectedLeadTeam =
    selectedLeadTeamId != null
      ? teamsWithMinistry.find((t) => t.id === selectedLeadTeamId)
      : (teamsWithMinistry[0] ?? null);
  const effectiveLeadTeamId = selectedLeadTeam?.id ?? selectedLeadTeamId;
  const ministryTabLabel = selectedLeadTeam
    ? (ministryAbbreviationByMinistryId.get(
        selectedLeadTeam.primaryOrganizationId
      ) ??
      selectedLeadTeam.displayName ??
      selectedLeadTeam.name ??
      'Ministry')
    : 'Ministry';

  const hasMultipleTeamsWithMinistry = teamsWithMinistry.length > 1;

  const ministryTabLeadTeamConflict = useMemo(
    () =>
      hasMinistryTabLeadTeamFilterConflict(
        activeTab === 'ministry'
          ? (effectiveLeadTeamId ?? undefined)
          : undefined,
        listPreferences.filterState.leadTeamIds
      ),
    [activeTab, effectiveLeadTeamId, listPreferences.filterState.leadTeamIds]
  );

  const listEffectiveScope = useMemo(
    () =>
      buildActivityListEffectiveScope({
        tab: activeTab,
        preferences: listPreferences,
        statusArchiveIds: {},
        canViewDeleted,
        watchlistActivityIds: favouriteActivityIds,
        ministryConflict: ministryTabLeadTeamConflict,
        ministryTabLabel,
        userId: user?.id,
        userTeamIds,
        effectiveLeadTeamId,
      }),
    [
      activeTab,
      listPreferences,
      canViewDeleted,
      favouriteActivityIds,
      ministryTabLeadTeamConflict,
      ministryTabLabel,
      user?.id,
      userTeamIds,
      effectiveLeadTeamId,
    ]
  );

  const scopeInput = useMemo(
    () => ({
      tab: activeTab,
      canViewDeleted,
      watchlistActivityIds: favouriteActivityIds,
      ministryConflict: ministryTabLeadTeamConflict,
      ministryTabLabel,
      userId: user?.id,
      userTeamIds,
      effectiveLeadTeamId,
    }),
    [
      activeTab,
      canViewDeleted,
      favouriteActivityIds,
      ministryTabLeadTeamConflict,
      ministryTabLabel,
      user?.id,
      userTeamIds,
      effectiveLeadTeamId,
    ]
  );

  const prevTabForReportRef = useRef(activeTab);
  const prevLeadTeamForReportRef = useRef(effectiveLeadTeamId);

  useEffect(() => {
    if (!initialTabAppliedRef.current) return;

    const tabChanged = prevTabForReportRef.current !== activeTab;
    const teamChanged =
      prevLeadTeamForReportRef.current !== effectiveLeadTeamId;

    if (!tabChanged && !teamChanged) return;

    prevTabForReportRef.current = activeTab;
    prevLeadTeamForReportRef.current = effectiveLeadTeamId;

    if (isReportDialogOpen) {
      closeReport();
    }
  }, [activeTab, effectiveLeadTeamId, isReportDialogOpen, closeReport]);

  useEffect(() => {
    if (
      listEffectiveScope.reportAvailability !== 'allowed' &&
      isReportDialogOpen
    ) {
      closeReport();
    }
  }, [listEffectiveScope.reportAvailability, isReportDialogOpen, closeReport]);

  const tableProps = useMemo(() => {
    const tabScope = buildActivityListTabServerScope({
      tab: activeTab,
      userId: user?.id,
      userTeamIds,
      effectiveLeadTeamId,
    });
    return activityListTabServerScopeToTableProps(
      activeTab,
      tabScope,
      favouriteActivityIds
    );
  }, [
    activeTab,
    effectiveLeadTeamId,
    user?.id,
    userTeamIds,
    favouriteActivityIds,
  ]);

  const activeReportMeta = useMemo(
    () =>
      activeReportName != null
        ? activityListReports.find((r) => r.name === activeReportName)
        : undefined,
    [activeReportName, activityListReports]
  );

  const handleShowFullActivityList = useCallback(() => {
    setActiveTab('all');
    setStoredActivityListTab('all');
  }, []);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {canCreateActivity ? (
        <Button asChild size="default">
          <Link to="/create-activity" {...activityFormLinkState(location)}>
            <Plus className="h-4 w-4" />
            New activity
          </Link>
        </Button>
      ) : (
        <Button
          size="default"
          disabled
          title="You do not have permission to create activities"
        >
          <Plus className="h-4 w-4" />
          New activity
        </Button>
      )}
      {canViewReports && activityListReports.length > 0 ? (
        <ActivityListReportsMenu
          reports={activityListReports}
          availability={listEffectiveScope.reportAvailability}
          onOpenReport={openReport}
          onShowFullList={handleShowFullActivityList}
          showLookAheadLink={canViewLookAhead}
        />
      ) : null}
    </div>
  );

  return (
    <>
      <PageHeader title="Calendar activities" action={headerActions} />

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const tab = v as ActivityListTabValue;
          setActiveTab(tab);
          setStoredActivityListTab(tab);
        }}
      >
        <div className="mb-0">
          <TabsList className="mb-0" variant="line" size="med">
            <TabsTrigger value="all">All</TabsTrigger>
            {showMinistryTab && (
              <TabsTrigger value="ministry" className="gap-2">
                {ministryTabLabel}
                {hasMultipleTeamsWithMinistry && (
                  <Popover>
                    <PopoverTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        className="hover:bg-muted rounded p-0.5"
                        aria-label="Choose team"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-56 p-2">
                      <ul className="space-y-0.5">
                        {teamsWithMinistry.map((team) => (
                          <li key={team.id}>
                            <button
                              type="button"
                              className={cn(
                                'hover:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm',
                                effectiveLeadTeamId === team.id &&
                                  'bg-muted font-medium'
                              )}
                              onClick={() => {
                                setSelectedLeadTeamId(team.id);
                              }}
                            >
                              {ministryAbbreviationByMinistryId.get(
                                team.primaryOrganizationId
                              ) ??
                                team.displayName ??
                                team.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="my-activities">My activities</TabsTrigger>
            <TabsTrigger value="shared-with-me">Shared with us</TabsTrigger>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
            {canManageFavourites ? (
              <TabsTrigger value="favourites">My watchlist</TabsTrigger>
            ) : null}
          </TabsList>
        </div>

        <div className="mt-0 min-w-0">
          <ActivityTable
            {...tableProps}
            includeLegacy={activeTab === 'all'}
            activeSavedFilter={activeSavedFilter}
            onActiveSavedFilterChange={setActiveSavedFilter}
          />
        </div>
      </Tabs>

      {canViewReports &&
      activeReportName != null &&
      activeReportMeta != null &&
      listEffectiveScope.reportAvailability === 'allowed' ? (
        <ActivityListReportDialog
          reportName={activeReportName}
          displayTitle={(activeReportMeta.displayName ?? '').replace(
            /\bReport$/,
            'report'
          )}
          listPreferences={listPreferences}
          appliedSavedFilterName={activeSavedFilter?.name ?? null}
          scopeInput={scopeInput}
          open={isReportDialogOpen}
          onOpenChange={onReportDialogOpenChange}
        />
      ) : null}
    </>
  );
};
