import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityEventSection } from './ActivityEventSection';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [] }),
}));

vi.mock('@/components/ui/address-autocomplete', () => ({
  AddressAutocomplete: () => <input readOnly />,
}));

vi.mock('@/components/ui/rich-text-field', () =>
  import('@/test-utils/rich-text-field-mock').then((module) => ({
    RichTextField: module.RichTextFieldMock,
  }))
);

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

function EventSectionHarness({
  onFormReady,
}: {
  onFormReady: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
}) {
  const form = useForm<ActivityFormData>({
    defaultValues: {
      ...(getDefaultFormValues() as ActivityFormData),
      eventPlanners: [
        {
          eventPlannerId: 42,
          eventPlannerName: 'Former Planner',
          isLead: true,
        },
      ],
    },
  });

  onFormReady(form);

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly: false,
          canViewFieldScope: () => true,
          canEditFieldScope: () => true,
        }}
      >
        <ActivityEventSection
          venueStatuses={[]}
          representativeOptions={[]}
          premierRequestedOptions={[]}
          eventPlannerOptions={[{ value: '7', label: 'Available Planner' }]}
          teamMinistryRefs={[]}
        />
      </ActivityEditProvider>
    </FormProvider>
  );
}

describe('ActivityEventSection event planner labels', () => {
  it('retains an unavailable assigned planner label after adding a planner', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <EventSectionHarness
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    expect(screen.getByText('Former Planner')).toBeInTheDocument();

    const plannerInput = document.querySelector('input[placeholder=""]');
    if (!plannerInput) throw new Error('Event planner input was not rendered');
    await user.click(plannerInput);
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Available Planner' })
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: 'Available Planner' }));

    expect(formRef?.getValues('eventPlanners')).toEqual([
      { eventPlannerId: 42, isLead: true },
      { eventPlannerId: 7, isLead: false },
    ]);
    expect(screen.getByText('Former Planner')).toBeInTheDocument();
  });
});
