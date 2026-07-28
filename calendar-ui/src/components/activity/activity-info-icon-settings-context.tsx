import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  buildActivityInfoIconSettingsMap,
  DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
  type ActivityInfoIconFieldKey,
} from '@corpcal/shared';
import { fetchActivityInfoIconSettings } from '@/api/activityInfoIconSettingsApi';
import { InfoIconButton } from '@/components/ui/info-icon-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type ActivityInfoIconSettingsContextValue = {
  getText: (fieldKey: ActivityInfoIconFieldKey) => string | undefined;
};

const ActivityInfoIconSettingsContext =
  createContext<ActivityInfoIconSettingsContextValue | null>(null);

export function ActivityInfoIconSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data } = useQuery({
    queryKey: ['settings', 'activity-info-icons'],
    queryFn: fetchActivityInfoIconSettings,
    retry: false,
    staleTime: 60_000,
    initialData: DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
  });

  const value = useMemo<ActivityInfoIconSettingsContextValue>(() => {
    const textMap = buildActivityInfoIconSettingsMap(data);
    return {
      getText: (fieldKey) => textMap.get(fieldKey),
    };
  }, [data]);

  return (
    <ActivityInfoIconSettingsContext.Provider value={value}>
      {children}
    </ActivityInfoIconSettingsContext.Provider>
  );
}

export function useActivityInfoIconText(fieldKey: ActivityInfoIconFieldKey) {
  const context = useContext(ActivityInfoIconSettingsContext);
  if (!context) {
    throw new Error('ActivityInfoIconSettingsProvider is missing');
  }
  return context.getText(fieldKey);
}

type ActivityFieldInfoIconProps = {
  fieldKey: ActivityInfoIconFieldKey;
  ariaLabel: string;
};

export function ActivityFieldInfoIcon({
  fieldKey,
  ariaLabel,
}: ActivityFieldInfoIconProps) {
  const text = useActivityInfoIconText(fieldKey);

  if (!text) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <InfoIconButton aria-label={ariaLabel} />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-w-[calc(100vw-2rem)] text-sm whitespace-pre-line"
        align="start"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
}
