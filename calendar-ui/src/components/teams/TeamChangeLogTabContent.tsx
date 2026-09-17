import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { fetchTeamHistory } from '@/api/teamsApi';
import { HistoryList, toTeamHistoryViewModel } from '@/components/history';

interface TeamChangeLogTabContentProps {
  teamId: number;
}

export function TeamChangeLogTabContent({
  teamId,
}: TeamChangeLogTabContentProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['teamHistory', teamId],
    queryFn: () => fetchTeamHistory(teamId),
    enabled: teamId > 0,
  });

  const historyEntries = useMemo(
    () => history.map(toTeamHistoryViewModel),
    [history]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-slate-500">No history entries.</p>;
  }

  return <HistoryList entries={historyEntries} className="max-w-3xl py-4" />;
}
