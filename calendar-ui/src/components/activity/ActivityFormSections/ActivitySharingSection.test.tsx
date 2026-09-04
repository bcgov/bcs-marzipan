import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared/auth';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { useAuth } from '@/hooks/useAuth';
import { useUnshareActivityTeam } from '@/hooks/useCalendar';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import {
  ActivitySharingSection,
  type SharingTeamLookup,
} from './ActivitySharingSection';

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
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useCalendar', () => ({
  useUnshareActivityTeam: vi.fn(),
}));

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

const mockUnshareMutate = vi.fn();

beforeEach(() => {
  mockUnshareMutate.mockReset();
  vi.mocked(useAuth).mockReturnValue({
    user: { teamIds: [] },
    hasPermission: () => false,
  } as unknown as ReturnType<typeof useAuth>);
  vi.mocked(useUnshareActivityTeam).mockReturnValue({
    mutate: mockUnshareMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUnshareActivityTeam>);
});

function ActivitySharingSectionHarness({
  readOnly = false,
  defaultValues,
  onFormReady,
  sharedWithTeams = [],
  activityId,
}: {
  readOnly?: boolean;
  defaultValues?: Partial<ActivityFormData>;
  onFormReady?: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
  sharedWithTeams?: SharingTeamLookup[];
  activityId?: number;
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
          quickShareGroups={[]}
          activityId={activityId}
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

describe('ActivitySharingSection unshare own team', () => {
  const TEAM_A: SharingTeamLookup = {
    id: 7,
    name: 'AG Comms',
    displayName: 'AG Comms',
    ministryId: null,
  };
  const TEAM_B: SharingTeamLookup = {
    id: 8,
    name: 'Other Team',
    displayName: 'Other Team',
    ministryId: null,
  };

  function renderUnshareHarness(options: {
    readOnly?: boolean;
    canUnshare?: boolean;
    userTeamIds?: number[];
    sharedWithTeamIds?: number[];
    /** Pass null (not undefined) to omit activityId; undefined falls back to the 104 default. */
    activityId?: number | null;
  }) {
    const {
      readOnly = true,
      canUnshare = true,
      userTeamIds = [7],
      sharedWithTeamIds = [7, 8],
      activityId = 104,
    } = options;

    vi.mocked(useAuth).mockReturnValue({
      user: { teamIds: userTeamIds },
      hasPermission: (key: string) =>
        canUnshare && key === PERMISSIONS.ACTIVITIES.UNSHARE,
    } as unknown as ReturnType<typeof useAuth>);

    return render(
      <ActivitySharingSectionHarness
        readOnly={readOnly}
        activityId={activityId ?? undefined}
        sharedWithTeams={[TEAM_A, TEAM_B]}
        defaultValues={{ sharedWithTeamIds }}
      />
    );
  }

  it('renders a Remove button when readOnly, permitted, and the team is shared and owned', () => {
    renderUnshareHarness({});

    expect(
      screen.getByRole('button', { name: /Remove AG Comms/i })
    ).toBeInTheDocument();
    // Not a member of Other Team, so no button for it.
    expect(
      screen.queryByRole('button', { name: /Remove Other Team/i })
    ).not.toBeInTheDocument();
  });

  it('does not render when the section is not read-only', () => {
    renderUnshareHarness({ readOnly: false });

    expect(
      screen.queryByRole('button', { name: /Remove AG Comms/i })
    ).not.toBeInTheDocument();
  });

  it('does not render without activities.unshare permission', () => {
    renderUnshareHarness({ canUnshare: false });

    expect(
      screen.queryByRole('button', { name: /Remove AG Comms/i })
    ).not.toBeInTheDocument();
  });

  it('does not render when the team is not currently shared', () => {
    renderUnshareHarness({ sharedWithTeamIds: [8] });

    expect(
      screen.queryByRole('button', { name: /Remove AG Comms/i })
    ).not.toBeInTheDocument();
  });

  it('does not render without an activityId', () => {
    renderUnshareHarness({ activityId: null });

    expect(
      screen.queryByRole('button', { name: /Remove AG Comms/i })
    ).not.toBeInTheDocument();
  });

  it('calls the mutation with { id, teamId } on click', async () => {
    const user = userEvent.setup();
    renderUnshareHarness({});

    await user.click(screen.getByRole('button', { name: /Remove AG Comms/i }));

    expect(mockUnshareMutate).toHaveBeenCalledWith(
      { id: 104, teamId: 7 },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('removes the team from the sharedWithTeamIds form field on success', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    vi.mocked(useAuth).mockReturnValue({
      user: { teamIds: [7] },
      hasPermission: () => true,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <ActivitySharingSectionHarness
        readOnly
        activityId={104}
        sharedWithTeams={[TEAM_A, TEAM_B]}
        defaultValues={{ sharedWithTeamIds: [7, 8] }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: /Remove AG Comms/i }));

    const [, options] = mockUnshareMutate.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ];
    options.onSuccess();

    expect(formRef?.getValues('sharedWithTeamIds')).toEqual([8]);
  });
});
