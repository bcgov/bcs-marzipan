import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { createMockTeamListItem } from '@corpcal/shared/test-utils';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityOverviewSection } from './ActivityOverviewSection';

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

const globalCategory = {
  id: 1,
  name: 'global_category',
  displayName: 'Global Category',
  visibility: 'global' as const,
};

const teamCategory = {
  id: 2,
  name: 'team_category',
  displayName: 'Team Category',
  visibility: 'team' as const,
  teamIds: [99],
};

const globalTag = {
  id: 10,
  text: 'Global Tag',
  visibility: 'global' as const,
};

const teamTag = {
  id: 20,
  text: 'Team Tag',
  visibility: 'team' as const,
  teamIds: [99],
};

const defaultLeadTeamField = {
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
};

function PicklistHarness({
  categories = [globalCategory, teamCategory],
  tags = [globalTag, teamTag],
  userTeamIds = [5],
  hasCreateAny = false,
  categoryIds = [] as number[],
  tagIds = [] as number[],
  onFormReady,
}: {
  categories?: Array<{
    id: number;
    name: string;
    displayName?: string;
    visibility?: string;
    teamIds?: number[];
  }>;
  tags?: Array<{
    id: number;
    text: string;
    visibility?: string;
    teamIds?: number[];
  }>;
  userTeamIds?: number[];
  hasCreateAny?: boolean;
  categoryIds?: number[];
  tagIds?: number[];
  onFormReady?: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
}) {
  const form = useForm<ActivityFormData>({
    defaultValues: {
      ...(getDefaultFormValues() as ActivityFormData),
      categoryIds,
      tagIds,
      leadTeamId: 5,
    },
  });

  onFormReady?.(form);

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly: false,
          canViewFieldScope: () => true,
          canEditFieldScope: () => true,
        }}
      >
        <ActivityOverviewSection
          categories={categories}
          organizations={[]}
          tags={tags}
          pitchRequiredStatuses={[]}
          userTeamIds={userTeamIds}
          hasCreateAny={hasCreateAny}
          leadTeamField={defaultLeadTeamField}
        />
      </ActivityEditProvider>
    </FormProvider>
  );
}

async function openCategoryPicklist(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByPlaceholderText('Select categories...');
  await user.click(input);
}

async function openTagPicklist(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByPlaceholderText('Select tags...');
  await user.click(input);
}

describe('ActivityOverviewSection lookup picklist selectability', () => {
  it('hides non-selectable team categories from the dropdown', async () => {
    const user = userEvent.setup();
    render(<PicklistHarness />);

    await openCategoryPicklist(user);

    expect(
      await screen.findByRole('option', { name: 'Global Category' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Team Category' })
    ).not.toBeInTheDocument();
  });

  it('shows team categories when the user belongs to the scoped team', async () => {
    const user = userEvent.setup();
    render(<PicklistHarness userTeamIds={[99]} />);

    await openCategoryPicklist(user);

    expect(
      await screen.findByRole('option', { name: 'Team Category' })
    ).toBeInTheDocument();
  });

  it('shows all categories for CREATE_ANY users', async () => {
    const user = userEvent.setup();
    render(<PicklistHarness hasCreateAny userTeamIds={[]} />);

    await openCategoryPicklist(user);

    expect(
      await screen.findByRole('option', { name: 'Global Category' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Team Category' })
    ).toBeInTheDocument();
  });

  it('keeps grandfathered category chips visible and not re-addable after removal', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <PicklistHarness
        categoryIds={[teamCategory.id]}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    expect(screen.getByText('Team Category')).toBeInTheDocument();

    await openCategoryPicklist(user);
    expect(
      screen.queryByRole('option', { name: 'Team Category' })
    ).not.toBeInTheDocument();

    const chip = screen
      .getByText('Team Category')
      .closest('[data-slot=combobox-chip]');
    expect(chip).toBeTruthy();
    const removeButton = (chip as HTMLElement).querySelector(
      '[data-slot=combobox-chip-remove]'
    );
    expect(removeButton).toBeTruthy();
    await user.click(removeButton as HTMLElement);

    await waitFor(() => {
      expect(formRef!.getValues('categoryIds')).toEqual([]);
    });
    expect(screen.queryByText('Team Category')).not.toBeInTheDocument();

    await openCategoryPicklist(user);
    expect(
      screen.queryByRole('option', { name: 'Team Category' })
    ).not.toBeInTheDocument();
  });

  it('hides non-selectable team tags from the dropdown', async () => {
    const user = userEvent.setup();
    render(<PicklistHarness />);

    await openTagPicklist(user);

    expect(
      await screen.findByRole('option', { name: 'Global Tag' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Team Tag' })
    ).not.toBeInTheDocument();
  });

  it('shows all tags for CREATE_ANY users', async () => {
    const user = userEvent.setup();
    render(<PicklistHarness hasCreateAny userTeamIds={[]} />);

    await openTagPicklist(user);

    expect(
      await screen.findByRole('option', { name: 'Global Tag' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Team Tag' })
    ).toBeInTheDocument();
  });
});
