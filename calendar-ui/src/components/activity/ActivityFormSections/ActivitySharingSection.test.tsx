import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivitySharingSection } from './ActivitySharingSection';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
});

vi.mock('@/hooks/useLeadTeamOptions', () => ({
  useLeadTeamOptions: () => ({
    data: [{ id: 5, name: 'Comms Team', displayName: 'Comms Team' }],
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { teamIds: [] },
    hasPermission: () => false,
  }),
}));

vi.mock('@/hooks/useCalendar', () => ({
  useUnshareActivityTeam: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

function ActivitySharingSectionHarness({
  readOnly = false,
  defaultValues,
  onFormReady,
}: {
  readOnly?: boolean;
  defaultValues?: Partial<ActivityFormData>;
  onFormReady?: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
}) {
  const form = useForm<ActivityFormData>({
    defaultValues: {
      ...(getDefaultFormValues() as ActivityFormData),
      leadTeamId: 5,
      ...defaultValues,
    },
  });

  onFormReady?.(form);

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly,
          canViewFieldScope: () => true,
          canEditFieldScope: () => true,
        }}
      >
        <ActivitySharingSection sharedWithTeams={[]} quickShareGroups={[]} />
      </ActivityEditProvider>
    </FormProvider>
  );
}

describe('ActivitySharingSection visibility switch', () => {
  it('maps the switch to team visibility when checked', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivitySharingSectionHarness
        defaultValues={{ visibility: 'global' }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const restrictSwitch = screen.getByRole('switch', {
      name: /Restrict access/i,
    });
    expect(restrictSwitch).not.toBeChecked();
    expect(
      screen.getByText(/This activity is visible to all calendar users/i)
    ).toBeInTheDocument();

    await user.click(restrictSwitch);

    expect(restrictSwitch).toBeChecked();
    expect(formRef?.getValues('visibility')).toBe('team');
    expect(
      screen.getByText(
        /This activity is visible only to Comms Team, shares, and exec/i
      )
    ).toBeInTheDocument();
  });

  it('maps the switch to global visibility when unchecked', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivitySharingSectionHarness
        defaultValues={{ visibility: 'team' }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const restrictSwitch = screen.getByRole('switch', {
      name: /Restrict access/i,
    });
    expect(restrictSwitch).toBeChecked();

    await user.click(restrictSwitch);

    expect(restrictSwitch).not.toBeChecked();
    expect(formRef?.getValues('visibility')).toBe('global');
  });
});
