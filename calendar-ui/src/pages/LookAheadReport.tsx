import { useQuery } from '@tanstack/react-query';

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
import { exportLookAheadToPdf } from '../lib/look-ahead-pdf-export';

export function LookAheadReport() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['look-ahead'],
    queryFn: () => fetchLookAheadData(),
  });

  useLookAheadWebSocket({
    onActivityUpdate: () => {
      void refetch();
    },
  });

  const handleExportPdf = () => {
    if (data?.sections) {
      exportLookAheadToPdf(data);
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <StatusMessage
          title="Error loading report"
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load Look Ahead data'
          }
          variant="error"
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-16">
        <p className="text-muted-foreground">Loading Look Ahead report...</p>
      </div>
    );
  }

  const sections = data.sections;

  return (
    <div className="p-8">
      <PageHeader
        title="Look Ahead"
        description={data.report?.displayName ?? undefined}
        action={
          <Button variant="outline" onClick={handleExportPdf}>
            Export PDF
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
    </div>
  );
}
