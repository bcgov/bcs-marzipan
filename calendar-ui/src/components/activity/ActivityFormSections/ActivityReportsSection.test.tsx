import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';
import { buildPayloadForUpdate } from '@/lib/activity-form-payload';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityReportsSection } from './ActivityReportsSection';

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
  useReports: () => ({ data: [], isLoading: false }),
}));

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

function ActivityReportsSectionHarness({
  defaultValues,
  onFormReady,
}: {
  defaultValues?: Partial<ActivityFormData>;
  onFormReady?: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
}) {
  const form = useForm<ActivityFormData>({
    defaultValues: {
      ...(getDefaultFormValues() as ActivityFormData),
      ...defaultValues,
    },
  });

  onFormReady?.(form);

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly: false,
          canViewFieldScope: (scope) => scope === 'lookAhead',
          canEditFieldScope: () => true,
        }}
      >
        <ActivityReportsSection />
      </ActivityEditProvider>
    </FormProvider>
  );
}

function getLookAheadSectionNoneRadio(): HTMLElement {
  const radio = document.getElementById('lookAhead-section-none');
  if (!radio) {
    throw new Error('Expected look-ahead section None radio');
  }
  return radio;
}

describe('ActivityReportsSection look ahead section', () => {
  it('renders a None option for look-ahead section', () => {
    render(<ActivityReportsSectionHarness />);

    expect(getLookAheadSectionNoneRadio()).toBeInTheDocument();
    expect(screen.getByLabelText('Events')).toBeInTheDocument();
  });

  it('clears lookAheadSection when None is selected', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityReportsSectionHarness
        defaultValues={{ lookAheadSection: 'events' }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    await user.click(getLookAheadSectionNoneRadio());

    expect(formRef?.getValues('lookAheadSection')).toBeUndefined();
  });

  it('maps cleared lookAheadSection to null in update payloads', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityReportsSectionHarness
        defaultValues={{ lookAheadSection: 'events' }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    await user.click(getLookAheadSectionNoneRadio());

    const formValues = formRef!.getValues();
    const payload = buildPayloadForUpdate(formValues, formValues);

    expect(payload.lookAheadSection).toBeNull();
  });
});
