import { ChevronDown, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { TeamListItem } from '@corpcal/shared/api/types';
import { ActivityTable } from '@/components/activity/ActivityTable';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLeadTeamOptions } from '@/hooks/useLeadTeamOptions';
import { useMinistries } from '@/hooks/useLookups';
import { buildSavedFilterContextKey } from '@/lib/savedFilterContextKey';
import { cn } from '@/lib/utils';

const ACTIVITY_LIST_TAB_STORAGE_KEY = 'activityListTab';

type ActivityListTabValue =
  | 'all'
  | 'ministry'
  | 'my-activities'
  | 'recent'
  | 'shared-with-me';

const ACTIVITY_LIST_TAB_VALUES: readonly ActivityListTabValue[] = [
  'all',
  'ministry',
  'my-activities',
  'recent',
  'shared-with-me',
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
 * Tabs filter the list: All, ministry lead team, My activities, Recent (disabled), Shared with me.
 */
export const ActivityListPage = () => {
  const { user, hasPermission } = useAuth();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);

  const [activeTab, setActiveTab] = useState<ActivityListTabValue>('all');
  const initialTabAppliedRef = useRef(false);
  const [selectedLeadTeamId, setSelectedLeadTeamId] = useState<number | null>(
    null
  );

  const { data: leadTeamOptions = [] } = useLeadTeamOptions(true);
  const { data: ministries = [] } = useMinistries();

  const userTeamIds = useMemo(() => user?.teamIds ?? [], [user?.teamIds]);
  const userTeams = useMemo(
    () => leadTeamOptions.filter((t) => userTeamIds.includes(t.id)),
    [leadTeamOptions, userTeamIds]
  );
  const teamsWithMinistry = useMemo(
    () =>
      userTeams.filter(
        (t): t is TeamListItem & { ministryId: number } => t.ministryId != null
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
    ? (ministryAbbreviationByMinistryId.get(selectedLeadTeam.ministryId) ??
      selectedLeadTeam.displayName ??
      selectedLeadTeam.name ??
      'Ministry')
    : 'Ministry';

  const hasMultipleTeamsWithMinistry = teamsWithMinistry.length > 1;

  const savedFilterContextKey = useMemo(
    () => buildSavedFilterContextKey(activeTab, effectiveLeadTeamId),
    [activeTab, effectiveLeadTeamId]
  );

  const tableProps = useMemo(() => {
    const base = { savedFilterContextKey };
    switch (activeTab) {
      case 'all':
        return base;
      case 'ministry':
        return effectiveLeadTeamId != null
          ? { ...base, leadTeamId: effectiveLeadTeamId }
          : base;
      case 'my-activities':
        return user?.id != null
          ? { ...base, commsContactLeadUserId: user.id }
          : base;
      case 'recent':
        return base;
      case 'shared-with-me':
        return userTeamIds.length > 0
          ? { ...base, sharedWithTeamIds: userTeamIds }
          : base;
      default:
        return base;
    }
  }, [
    activeTab,
    effectiveLeadTeamId,
    user?.id,
    userTeamIds,
    savedFilterContextKey,
  ]);

  return (
    <>
      <PageHeader
        title="Calendar activities"
        description="View and manage calendar activities"
        action={
          <Button
            onClick={() => window.open('/create-activity')}
            disabled={!canCreateActivity}
            title={
              !canCreateActivity
                ? 'You do not have permission to create activities'
                : undefined
            }
          >
            <Plus className="h-4 w-4" />
            New activity
          </Button>
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
                                team.ministryId
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
            <TabsTrigger value="shared-with-me">Shared with me</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="min-w-0">
            <ActivityTable {...tableProps} />
          </div>
        </TabsContent>
        {showMinistryTab && (
          <TabsContent value="ministry" className="mt-0">
            <div className="min-w-0">
              <ActivityTable {...tableProps} />
            </div>
          </TabsContent>
        )}
        <TabsContent value="my-activities" className="mt-0">
          <div className="min-w-0">
            <ActivityTable {...tableProps} />
          </div>
        </TabsContent>
        <TabsContent value="recent" className="mt-0">
          <div className="min-w-0">
            <ActivityTable />
          </div>
        </TabsContent>
        <TabsContent value="shared-with-me" className="mt-0">
          <div className="min-w-0">
            <ActivityTable {...tableProps} />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};
