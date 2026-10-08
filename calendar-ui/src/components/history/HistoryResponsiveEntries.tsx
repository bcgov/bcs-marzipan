import { type ReactNode, type RefObject } from 'react';

import { GLOBAL_HISTORY_TABLE_SCROLL_HEIGHT } from '@/components/table/tableConstants';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import { useIsMobile } from '@/hooks/use-mobile';

import { HISTORY_LIST_CONTENT_CLASSNAME } from './history-list-layout';
import type {
  HistoryEntryViewModel,
  HistoryListVariant,
} from './history-types';
import { HistoryList } from './HistoryList';
import { HistoryListToolbar } from './HistoryListToolbar';
import { HistoryTable } from './HistoryTable';

type HistoryResponsiveEntriesProps = {
  entries: HistoryEntryViewModel[];
  listVariant?: HistoryListVariant;
  tableScrollRef: RefObject<HTMLDivElement | null>;
  renderCountSummary: (countTrailing?: ReactNode) => ReactNode;
};

export function HistoryResponsiveEntries({
  entries,
  listVariant = 'compact',
  tableScrollRef,
  renderCountSummary,
}: HistoryResponsiveEntriesProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <HistoryList
        entries={entries}
        variant={listVariant}
        className={HISTORY_LIST_CONTENT_CLASSNAME}
      >
        {({ expandAll, groups }) => (
          <div className="min-w-0">
            <HistoryListToolbar summary={renderCountSummary(expandAll)} />
            <TableScrollContainer
              ref={tableScrollRef}
              scrollHeight={GLOBAL_HISTORY_TABLE_SCROLL_HEIGHT}
            >
              {groups}
            </TableScrollContainer>
          </div>
        )}
      </HistoryList>
    );
  }

  return (
    <HistoryTable entries={entries}>
      {({ expandAll, table }) => (
        <div className="min-w-0">
          <HistoryListToolbar summary={renderCountSummary(expandAll)} />
          <TableScrollContainer
            ref={tableScrollRef}
            scrollHeight={GLOBAL_HISTORY_TABLE_SCROLL_HEIGHT}
          >
            {table}
          </TableScrollContainer>
        </div>
      )}
    </HistoryTable>
  );
}
