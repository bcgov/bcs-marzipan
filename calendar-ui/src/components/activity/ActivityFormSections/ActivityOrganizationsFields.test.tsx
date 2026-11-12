import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityOrganizationsFields } from './ActivityOrganizationsFields';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
});

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

const orgOptions = [
  {
    value: 1,
    label: 'Ministry A',
    organizationTypeId: 10,
    organizationTypeDisplayName: 'Ministry',
    organizationTypeSortOrder: 0,
  },
  {
    value: 2,
    label: 'Agency B',
    organizationTypeId: 20,
    organizationTypeDisplayName: 'Agency',
    organizationTypeSortOrder: 1,
  },
];

function Harness({
  organizations = [] as ActivityFormData['organizations'],
}: {
  organizations?: ActivityFormData['organizations'];
}) {
  const form = useForm<ActivityFormData>({
    defaultValues: {
      ...getDefaultFormValues(),
      organizations,
    } as ActivityFormData,
  });

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly: false,
          canViewFieldScope: () => true,
          canEditFieldScope: () => true,
        }}
      >
        <ActivityOrganizationsFields
          organizationOptions={orgOptions}
          readOnly={false}
        />
      </ActivityEditProvider>
    </FormProvider>
  );
}

describe('ActivityOrganizationsFields', () => {
  it('shows lead and joint labels', () => {
    render(<Harness organizations={[{ organizationId: 1, isLead: true }]} />);
    expect(screen.getByText('Lead organization')).toBeInTheDocument();
  });

  it('expands joint section when joints exist on load', () => {
    render(
      <Harness
        organizations={[
          { organizationId: 1, isLead: true },
          { organizationId: 2, isLead: false },
        ]}
      />
    );
    expect(screen.getByText('Joint organizations')).toBeInTheDocument();
    expect(
      screen.queryByText('+ Add joint organizations')
    ).not.toBeInTheDocument();
  });

  it('shows add joint button when no joints', async () => {
    const user = userEvent.setup();
    render(<Harness organizations={[{ organizationId: 1, isLead: true }]} />);
    const addBtn = screen.getByRole('button', {
      name: '+ Add joint organizations',
    });
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByText('Joint organizations')).toBeInTheDocument();
    });
  });

  it('marks lead field with data-field organizations', () => {
    const { container } = render(
      <Harness organizations={[{ organizationId: 1, isLead: true }]} />
    );
    expect(
      container.querySelector('[data-field="organizations"]')
    ).toBeInTheDocument();
  });
});
