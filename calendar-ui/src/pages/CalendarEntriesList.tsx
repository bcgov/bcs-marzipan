import { EventTable } from '../components/EventTable';
import { CalendarFilters } from '../components/CalendarFilters';
import { Button } from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { ColumnFiltersState } from '@tanstack/react-table';
import { useState } from 'react';

export const CalendarEntriesList = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // for filters set through the CalendarFilters component
  const handleFilterUpdate = (filters: ColumnFiltersState): void => {
    setColumnFilters(filters);
  };

  //for keyword filters set in this component
  const handleKeywordInput = (keyword: string) => {
    setGlobalFilter(keyword);
  };

  return (
    <div>
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'hidden', // Prevents horizontal scrolling on the page
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
            gap: '16px',
          }}
        >
          {/* Add Button */}
          <Button
            appearance="primary"
            onClick={() => window.open('/create-activity')}
            icon={<Add24Regular />}
          >
            New Entry
          </Button>
        </header>

        {/* Content */}
        <div
          style={{
            // padding: '24px',
            overflowY: 'auto',
            backgroundColor: '#fafafa',
            flex: 1,
          }}
        >
          <CalendarFilters
            onFiltersChanged={handleFilterUpdate}
            onKeywordFilterChanged={handleKeywordInput}
          />
          <EventTable
            filters={columnFilters}
            globalFilterString={globalFilter}
          />
        </div>
      </div>
    </div>
  );
};
