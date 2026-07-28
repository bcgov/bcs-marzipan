import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import {
  buildActivityInfoIconSettingsMap,
  DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
  type ActivityInfoIconFieldKey,
} from '@corpcal/shared';
import {
  activityInfoIconSettingsRetryDelay,
  fetchActivityInfoIconSettings,
  readCachedActivityInfoIconSettings,
  shouldRetryActivityInfoIconSettings,
} from '@/api/activityInfoIconSettingsApi';
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
  const warnedRef = useRef(false);
  const cachedInitialData = useMemo(
    () => readCachedActivityInfoIconSettings(),
    []
  );

  const { data, error } = useQuery({
    queryKey: ['settings', 'activity-info-icons'],
    queryFn: fetchActivityInfoIconSettings,
    retry: shouldRetryActivityInfoIconSettings,
    retryDelay: activityInfoIconSettingsRetryDelay,
    staleTime: 60_000,
    initialData: cachedInitialData ?? DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
  });

  useEffect(() => {
    if (!error || warnedRef.current) return;
    warnedRef.current = true;
    if (cachedInitialData) {
      toast.warning('Showing cached info icon settings', {
        id: 'activity-info-icons-cached-fallback',
        description:
          'Latest settings could not be fetched right now. Using last saved local copy.',
        duration: 5000,
      });
      return;
    }
    toast.warning('Showing default info icon settings', {
      id: 'activity-info-icons-default-fallback',
      description:
        'Latest settings could not be fetched right now. Some configured icons may be temporarily unavailable.',
      duration: 5000,
    });
  }, [cachedInitialData, error]);

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
