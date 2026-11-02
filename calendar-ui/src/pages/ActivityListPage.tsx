import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { TeamListItem } from '@corpcal/shared/api/types';
import {
  ActivityTable,
  type ActivityTableActiveSavedFilter,
} from '@/components/activity/ActivityTable';
import { MinistryTabSelect } from '@/components/activity/MinistryTabSelect';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFavourites } from '@/hooks/useFavourites';
import { useActivityTeamSharing, useMinistries } from '@/hooks/useLookups';
import { activityFormLinkState } from '@/lib/activity-form-navigation-state';
import { formatMinistrySelectionLabel } from '@/lib/ministry-tab-label';

type UserTeam = Pick<TeamListItem, 'id' | 'ministryId' | 'ministryName'>;

const ACTIVITY_LIST_TAB_STORAGE_KEY = 'activityListTab';

type ActivityListTabValue =
  | 'all'
  | 'ministry'
  | 'my-activities'
  | 'recent'
  | 'shared-with-me'
  | 'favourites'
  | 'assigned-to-me';

const ACTIVITY_LIST_TAB_VALUES: readonly ActivityListTabValue[] = [
  'all',
  'ministry',
  'my-activities',
  'recent',
  'shared-with-me',
  'favourites',
  'assigned-to-me',
];

function getStoredActivityListTab(): ActivityListTabValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ACTIVITY_LIST_TAB_STORAGE_KEY);
    if (!raw) return null;
    if (ACTIVITY_LIST_TAB_VALUES.includes(raw as ActivityListTabValue)) {
      return raw as ActivityListTabValue;
    }
    return null;
  } catch {
    return null;
  }
}

function setStoredActivityListTab(tab: ActivityListTabValue): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ACTIVITY_LIST_TAB_STORAGE_KEY, tab);
  } catch {
    // ignore
  }
}

/**
 * Activity list. Rendered inside Layout, which wraps content with
 * the shared PageContainer (max-width, padding) so this page fits viewport width.
 * Tabs filter the list: All, user's ministry(ies), My activities, Shared with [ministry], etc.
 * Users in teams across several ministries can multiselect which ministries the
 * ministry and shared tabs cover.
 */
export const ActivityListPage = () => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);

  const [activeTab, setActiveTab] = useState<ActivityListTabValue>('all');
  const initialTabAppliedRef = useRef(false);
  const [ministryTabSelection, setMinistryTabSelection] = useState<number[]>(
    []
  );
  const [sharedTabSelection, setSharedTabSelection] = useState<number[]>([]);
  const [activeSavedFilter, setActiveSavedFilter] =
    useState<ActivityTableActiveSavedFilter | null>(null);

  const { data: activityTeamSharing } = useActivityTeamSharing();
  const { data: ministries = [] } = useMinistries();
  const allTeams = activityTeamSharing?.teams;
  const { favouriteActivityIds } = useFavourites();

  const userTeamIds = useMemo(() => user?.teamIds ?? [], [user?.teamIds]);
  const userTeams = useMemo(() => {
    return (allTeams ?? [])
      .filter((team) => userTeamIds.includes(team.id))
      .map(({ id, ministryId, ministryName }) => ({
        id,
        ministryId,
        ministryName,
      }));
  }, [allTeams, userTeamIds]);
  const teamsWithMinistry = useMemo(
    () =>
      userTeams.filter(
        (t): t is UserTeam & { ministryId: number } => t.ministryId != null
      ),
    [userTeams]
  );

  const userMinistryOptions = useMemo(() => {
    const ids = [...new Set(teamsWithMinistry.map((t) => t.ministryId))];
    return ids.map((id) => {
      const ministry = ministries.find((m) => m.id === id);
      const team = teamsWithMinistry.find((t) => t.ministryId === id);
      return {
        id,
        label:
          ministry?.abbreviation ??
          ministry?.displayName ??
          team?.ministryName ??
          'Ministry',
      };
    });
  }, [teamsWithMinistry, ministries]);

  const showMinistryTab = userMinistryOptions.length > 0;
  const hasMultipleMinistries = userMinistryOptions.length > 1;

  // Fall back to the first ministry until the user picks a valid selection.
  const resolveSelection = (selection: number[]): number[] => {
    const valid = userMinistryOptions
      .filter((o) => selection.includes(o.id))
      .map((o) => o.id);
    if (valid.length > 0) return valid;
    return userMinistryOptions.length > 0 ? [userMinistryOptions[0].id] : [];
  };
  const ministryTabIds = useMemo(
    () => resolveSelection(ministryTabSelection),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userMinistryOptions, ministryTabSelection]
  );
  const sharedTabIds = useMemo(
    () => resolveSelection(sharedTabSelection),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userMinistryOptions, sharedTabSelection]
  );

  const selectionLabel = (ids: number[]) =>
    formatMinistrySelectionLabel(
      userMinistryOptions.filter((o) => ids.includes(o.id)).map((o) => o.label)
    );
  const ministryTabLabel = selectionLabel(ministryTabIds);
  const sharedTabLabel = showMinistryTab
    ? `Shared with ${selectionLabel(sharedTabIds)}`
    : 'Shared with us';

  const sharedWithTeamIds = useMemo(() => {
    if (!showMinistryTab) return userTeamIds;
    const ids = new Set<number>();
    teamsWithMinistry.forEach((t) => {
      if (sharedTabIds.includes(t.ministryId)) ids.add(t.id);
    });
    allTeams?.forEach((t) => {
      if (t.ministryId != null && sharedTabIds.includes(t.ministryId)) {
        ids.add(t.id);
      }
    });
    return [...ids];
  }, [showMinistryTab, userTeamIds, teamsWithMinistry, allTeams, sharedTabIds]);

  useEffect(() => {
    if (initialTabAppliedRef.current) return;
    initialTabAppliedRef.current = true;

    const stored = getStoredActivityListTab();
    if (stored !== null) {
      if (stored === 'ministry' && !showMinistryTab) {
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
  }, [showMinistryTab]);

  const tableProps = useMemo(() => {
    const base = { watchlistActivityIds: favouriteActivityIds };
    switch (activeTab) {
      case 'all':
        return base;
      case 'ministry':
        return ministryTabIds.length > 0
          ? { ...base, leadMinistryIds: ministryTabIds }
          : base;
      case 'my-activities':
        return user?.id != null
          ? { ...base, commsContactLeadUserIds: [user.id] }
          : base;
      case 'recent':
        return base;
      case 'shared-with-me':
        return sharedWithTeamIds.length > 0
          ? { ...base, sharedWithTeamIds }
          : base;
      case 'favourites':
        return { ...base, favouriteActivityIds };
      case 'assigned-to-me':
        return user?.id != null
          ? { ...base, flagAssigneeUserIds: [user.id] }
          : base;
      default:
        return base;
    }
  }, [
    activeTab,
    ministryTabIds,
    user?.id,
    sharedWithTeamIds,
    favouriteActivityIds,
  ]);

  return (
    <>
      <PageHeader
        title="Calendar activities"
        action={
          canCreateActivity ? (
            <Button asChild>
              <Link to="/create-activity" {...activityFormLinkState(location)}>
                <Plus className="h-4 w-4" />
                New activity
              </Link>
            </Button>
          ) : (
            <Button
              disabled
              title="You do not have permission to create activities"
            >
              <Plus className="h-4 w-4" />
              New activity
            </Button>
          )
        }
      />

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
                {hasMultipleMinistries && (
                  <MinistryTabSelect
                    options={userMinistryOptions}
                    selectedIds={ministryTabIds}
                    onChange={setMinistryTabSelection}
                    ariaLabel="Choose ministries"
                  />
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="my-activities">My activities</TabsTrigger>
            <TabsTrigger value="shared-with-me" className="gap-2">
              {sharedTabLabel}
              {hasMultipleMinistries && (
                <MinistryTabSelect
                  options={userMinistryOptions}
                  selectedIds={sharedTabIds}
                  onChange={setSharedTabSelection}
                  ariaLabel="Choose ministries shared with"
                />
              )}
            </TabsTrigger>
            <TabsTrigger value="assigned-to-me">Assigned to me</TabsTrigger>
            <TabsTrigger value="favourites">My watchlist</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-0 min-w-0">
          {activeTab === 'recent' ? (
            <ActivityTable />
          ) : (
            <ActivityTable
              {...tableProps}
              activeSavedFilter={activeSavedFilter}
              onActiveSavedFilterChange={setActiveSavedFilter}
            />
          )}
        </div>
      </Tabs>
    </>
  );
};
