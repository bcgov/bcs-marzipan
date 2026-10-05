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

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

function ActivitySharingSectionHarness({
  readOnly = false,
  defaultValues,
  onFormReady,
  sharedWithTeams = [],
  quickShareGroups = [],
}: {
  readOnly?: boolean;
  defaultValues?: Partial<ActivityFormData>;
  onFormReady?: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
  sharedWithTeams?: import('./ActivitySharingSection').SharingTeamLookup[];
  quickShareGroups?: import('./ActivitySharingSection').QuickShareGroupLookup[];
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
        <ActivitySharingSection
          sharedWithTeams={sharedWithTeams}
          quickShareGroups={quickShareGroups}
        />
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

describe('ActivitySharingSection hidden assigned teams', () => {
  it('keeps hidden teams labeled and selected when a visible team is added', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivitySharingSectionHarness
        defaultValues={{ sharedWithTeamIds: [2] }}
        onFormReady={(form) => {
          formRef = form;
        }}
        sharedWithTeams={[
          {
            id: 1,
            name: 'Visible team',
            displayName: 'Visible team',
            ministryId: 6,
            isActive: true,
            appearsInShareWith: true,
          },
          {
            id: 2,
            name: 'Former share team',
            displayName: 'Former share team',
            ministryId: 5,
            isActive: true,
            appearsInShareWith: false,
          },
        ]}
        quickShareGroups={[
          { id: 1, name: 'Social', sortOrder: 0, ministryIds: [5] },
        ]}
      />
    );

    expect(screen.getByText('Former share team')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Share with' }));
    expect(
      screen.getByRole('button', { name: 'Share with social' })
    ).toBeDisabled();

    await user.click(screen.getByRole('option', { name: 'Visible team' }));

    expect(formRef?.getValues('sharedWithTeamIds')).toEqual([2, 1]);
    expect(screen.getByText('Former share team')).toBeInTheDocument();
    expect(screen.getAllByText('Visible team').length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('option', { name: 'Former share team' })
    ).toBeNull();
  });
});
