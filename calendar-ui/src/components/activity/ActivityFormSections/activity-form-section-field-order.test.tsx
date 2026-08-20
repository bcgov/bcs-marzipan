import { zodResolver } from '@hookform/resolvers/zod';
import { render } from '@testing-library/react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ReactNode } from 'react';

import {
  ACTIVITY_FORM_SECTION_FIELDS,
  type ActivityFormSectionId,
} from '@corpcal/shared';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import { createMockTeamListItem } from '@corpcal/shared/test-utils';
import type { FormLookupData } from '@/hooks/useFormLookups';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityEventSection } from './ActivityEventSection';
import { ActivityOverviewSection } from './ActivityOverviewSection';
import { ActivityReportsSection } from './ActivityReportsSection';
import { ActivityScheduleSection } from './ActivityScheduleSection';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
});

vi.mock('@/components/ui/rich-text-field', () =>
  import('@/test-utils/rich-text-field-mock').then((m) => ({
    RichTextField: m.RichTextFieldMock,
  }))
);

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

vi.mock('@/hooks/useLookAheadSectionRows', () => ({
  useLookAheadSectionRows: () => ({
    rows: [
      {
        sectionId: 'events',
        order: 1,
        lookAheadKey: 'events',
        uiLabel: 'Events',
        legendColor: '#000000',
      },
    ],
    isLoading: false,
    hasConfig: true,
  }),
  rowsToSectionOptions: (
    rows: Array<{ lookAheadKey: string | null; uiLabel: string }>
  ) =>
    rows
      .filter((row) => row.lookAheadKey != null)
      .map((row) => ({
        value: row.lookAheadKey as string,
        label: row.uiLabel,
      })),
}));

vi.mock('@/hooks/useLookups', () => ({
  useReports: () => ({
    data: [{ id: 1, name: '306090', displayName: '30-60-90' }],
    isLoading: false,
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: () => ({ data: [] }),
  };
});

vi.mock('@/components/ui/address-autocomplete', () => ({
  AddressAutocomplete: ({
    'data-field': dataField,
  }: {
    'data-field'?: string;
  }) => <input data-field={dataField} readOnly />,
}));

function toTopLevelFieldKey(dataField: string): string {
  const dotIndex = dataField.indexOf('.');
  return dotIndex === -1 ? dataField : dataField.slice(0, dotIndex);
}

function getRenderedTopLevelFieldOrder(container: HTMLElement): string[] {
  const elements = container.querySelectorAll('[data-field]');
  const order: string[] = [];
  let lastKey: string | undefined;

  for (const element of elements) {
    const dataField = element.getAttribute('data-field');
    if (!dataField) continue;

    const topLevel = toTopLevelFieldKey(dataField);
    if (topLevel !== lastKey) {
      order.push(topLevel);
      lastKey = topLevel;
    }
  }

  return order;
}

function expectedRegistryOrderForRenderedFields(
  sectionId: ActivityFormSectionId,
  renderedOrder: readonly string[]
): string[] {
  const renderedKeys = new Set(renderedOrder);
  return ACTIVITY_FORM_SECTION_FIELDS[sectionId]
    .filter((key) => renderedKeys.has(String(key)))
    .map(String);
}

function SectionFormHarness({
  children,
  canViewFieldScope = () => true,
}: {
  children: ReactNode;
  canViewFieldScope?: (scope: string) => boolean;
}) {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    defaultValues: getDefaultFormValues() as ActivityFormData,
  });

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly: false,
          canViewFieldScope,
          canEditFieldScope: () => true,
        }}
      >
        {children}
      </ActivityEditProvider>
    </FormProvider>
  );
}

const mockLookups: Pick<
  FormLookupData,
  'categories' | 'pitchRequiredStatuses'
> = {
  categories: [
    {
      id: 1,
      name: 'test_category',
      displayName: 'Test Category',
      visibility: 'global',
    },
  ],
  pitchRequiredStatuses: [
    {
      id: 1,
      label: 'Pending',
      value: 1,
      name: 'pending',
      displayName: 'Pending',
    },
  ],
};

describe('activity form section field order', () => {
  it('matches registry order in overview', () => {
    const { container } = render(
      <SectionFormHarness
        canViewFieldScope={(scope) =>
          scope === 'pitchStatus' || scope === 'pitchDate' || scope === 'notes'
        }
      >
        <ActivityOverviewSection
          categories={mockLookups.categories}
          organizations={[]}
          tags={[]}
          pitchRequiredStatuses={mockLookups.pitchRequiredStatuses}
          userTeamIds={[5]}
          hasCreateAny={false}
          leadTeamField={{
            options: [
              createMockTeamListItem({
                id: 5,
                name: 'Team',
                displayName: 'Team',
                abbreviation: 'TM',
                ministryId: 1,
                ministryName: 'Ministry',
                memberCount: 1,
              }),
            ],
            displayLabel: 'Team',
            optionsFetching: false,
          }}
        />
      </SectionFormHarness>
    );

    const renderedOrder = getRenderedTopLevelFieldOrder(container);
    expect(renderedOrder).toEqual(
      expectedRegistryOrderForRenderedFields('overview', renderedOrder)
    );
  });

  it('matches registry order in reports', () => {
    const { container } = render(
      <SectionFormHarness canViewFieldScope={(scope) => scope === 'lookAhead'}>
        <ActivityReportsSection />
      </SectionFormHarness>
    );

    const renderedOrder = getRenderedTopLevelFieldOrder(container);
    expect(renderedOrder).toEqual(
      expectedRegistryOrderForRenderedFields('reports', renderedOrder)
    );
  });

  it('matches registry order in schedule', () => {
    const { container } = render(
      <SectionFormHarness>
        <ActivityScheduleSection
          dateStatuses={[
            {
              id: 1,
              name: 'confirmed',
              displayName: 'Confirmed',
              label: 'Confirmed',
              value: 1,
            },
          ]}
          timeStatuses={[
            {
              id: 1,
              name: 'confirmed',
              displayName: 'Confirmed',
              label: 'Confirmed',
              value: 1,
            },
          ]}
        />
      </SectionFormHarness>
    );

    const renderedOrder = getRenderedTopLevelFieldOrder(container);
    expect(renderedOrder).toEqual(
      expectedRegistryOrderForRenderedFields('schedule', renderedOrder)
    );
  });

  it('matches registry order in event', () => {
    const { container } = render(
      <SectionFormHarness>
        <ActivityEventSection
          venueStatuses={[
            {
              id: 1,
              name: 'tbd',
              displayName: 'TBD',
              label: 'TBD',
              value: 1,
            },
          ]}
          representativeOptions={[]}
          premierRequestedOptions={[{ value: '1', label: 'No' }]}
          eventPlannerOptions={[]}
        />
      </SectionFormHarness>
    );

    const renderedOrder = getRenderedTopLevelFieldOrder(container);
    expect(renderedOrder).toEqual(
      expectedRegistryOrderForRenderedFields('event', renderedOrder)
    );
  });
});
