import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared/auth';

import { CreateActivityForm } from './CreateActivityForm';

let mockIsBlockedByRecurringLockout = false;

vi.mock('../hooks/useRecurringLockoutBanner', () => ({
  useRecurringEditLockout: () => ({
    isBlocked: mockIsBlockedByRecurringLockout,
    schedule: mockIsBlockedByRecurringLockout
      ? { isActive: true, startTimeOfDay: '09:00', endTimeOfDay: '10:00' }
      : null,
    banner: null,
  }),
  useRecurringLockoutBanner: () => null,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasPermission: () => true,
    isLoading: false,
    user: {
      id: 1,
      permissions: [PERMISSIONS.ACTIVITIES.CREATE],
      teamIds: [],
    },
  }),
}));

vi.mock('../hooks/useCalendar', () => ({
  useCreateActivity: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../hooks/useActivityFormSetup', () => ({
  useActivityFormSetup: () => ({
    form: {
      formState: { isDirty: false },
      handleSubmit: (onValid: () => void) => () => onValid(),
      reset: vi.fn(),
      getValues: () => ({}),
    },
    lookups: {
      isLoading: false,
      hasError: false,
      translationRequiredStatuses: [],
    },
    leadTeamOptions: [],
    leadTeamOptionsError: null,
    leadTeamOptionsFetching: false,
    refetchLeadTeamOptions: vi.fn(),
    commsContactCandidates: [],
  }),
}));

vi.mock('../hooks/useActivityFormSubmitState', () => ({
  useActivityFormSubmitState: () => ({
    missingFields: [],
    missingFieldItems: [],
    missingFieldsHelperText: null,
  }),
}));

vi.mock('@/components/activity', () => ({
  ActivityFormBody: ({ readOnly }: { readOnly?: boolean }) => (
    <textarea readOnly={readOnly} placeholder="Enter activity title" />
  ),
  ActivityFormMissingFieldsHint: () => null,
  ActivityFormStickyHeader: ({
    lockStrip,
  }: {
    lockStrip?: React.ReactNode;
  }) => <div data-testid="sticky-header">{lockStrip}</div>,
}));

function renderCreateForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CreateActivityForm />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('CreateActivityForm recurring lockout', () => {
  beforeEach(() => {
    mockIsBlockedByRecurringLockout = false;
  });

  it('disables fields and submit during recurring edit lockout', () => {
    mockIsBlockedByRecurringLockout = true;
    renderCreateForm();

    expect(screen.getByRole('alert')).toHaveTextContent(/locked until/i);
    expect(screen.getByPlaceholderText('Enter activity title')).toHaveAttribute(
      'readonly'
    );
    expect(screen.getByRole('button', { name: /^Submit$/i })).toBeDisabled();
  });
});
