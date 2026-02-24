import { Plus } from 'lucide-react';

import { PERMISSIONS } from '@corpcal/shared';
import { ActivityTable } from '@/components/ActivityTable';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

/**
 * Calendar Entries list. Rendered inside Layout, which wraps content with
 * the shared PageContainer (max-width, padding) so this page fits viewport width.
 */
export const CalendarEntriesList = () => {
  const { hasPermission } = useAuth();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);

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
            className="bg-(--bcsds-button-primary-background) text-white hover:bg-(--bcsds-button-primary-background)/95"
          >
            <Plus className="h-4 w-4" />
            New activity
          </Button>
        }
      />
      <div className="min-w-0">
        <ActivityTable />
      </div>
    </>
  );
};
