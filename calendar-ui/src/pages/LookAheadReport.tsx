import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchLookAheadData,
  type LookAheadSectionData,
} from '../api/reportsApi';
import { PageHeader } from '../components/PageHeader';
import { LookAheadSection } from '../components/reports/LookAheadSection';
import { StatusMessage } from '../components/StatusMessage';
import { Button } from '../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { useLookAheadWebSocket } from '../hooks/useLookAheadWebSocket';
import { showErrorToast } from '../lib/error-toast';

export function LookAheadReport() {
  const [isExporting, setIsExporting] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['look-ahead'],
    queryFn: () => fetchLookAheadData(),
  });

  useLookAheadWebSocket({
    onActivityUpdate: () => {
      void refetch();
    },
  });

  const handleExportPdf = async () => {
    if (!data?.sections) return;
    setIsExporting(true);
    try {
      const { exportLookAheadToPdf } =
        await import('../lib/look-ahead-pdf-export');
      exportLookAheadToPdf(data);
    } catch (error) {
      showErrorToast(error, 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (error) {
    return (
      <StatusMessage
        title="Error loading report"
        message={
          error instanceof Error
            ? error.message
            : 'Failed to load Look Ahead data'
        }
        variant="error"
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading Look Ahead report...</p>
      </div>
    );
  }

  const sections = data.sections;

  return (
    <>
      <PageHeader
        title="Look Ahead"
        description={data.report?.displayName ?? undefined}
        action={
          <Button
            variant="outline"
            onClick={() => void handleExportPdf()}
            disabled={isExporting}
          >
            {isExporting ? 'Preparing PDF...' : 'Export PDF'}
          </Button>
        }
      />
      <Tabs defaultValue={sections[0]?.id ?? 'events'} className="w-full">
        <TabsList className="mb-4">
          {sections.map((section: LookAheadSectionData) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section: LookAheadSectionData) => (
          <TabsContent
            key={section.id}
            value={section.id}
            className="mt-0 outline-none"
          >
            <LookAheadSection section={section} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
