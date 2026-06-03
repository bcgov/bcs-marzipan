import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityReleaseSection } from './ActivityReleaseSection';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
});

const mockLookups = {
  isLoading: false,
  hasError: false,
  categories: [],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  pitchStatuses: [],
  pitchRequiredStatuses: [],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [
    { id: 1, name: 'French', displayName: 'French' },
    { id: 2, name: 'Spanish', displayName: 'Spanish' },
  ],
  translationRequiredStatuses: [
    {
      id: 1,
      name: 'Not required',
      displayName: 'Not required',
      label: 'Not required',
      value: 1,
    },
    {
      id: 2,
      name: 'Required',
      displayName: 'Required',
      label: 'Required',
      value: 2,
    },
  ],
  governmentRepresentatives: [],
  newsReleaseDistributions: [{ value: '1', label: 'Internal' }],
  premierRequested: [],
  newsReleaseOrigins: [{ value: '1', label: 'Origin A' }],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

function ActivityReleaseSectionHarness({
  readOnly,
  canEditFieldScope,
}: {
  readOnly: boolean;
  canEditFieldScope?: (s: string) => boolean;
}) {
  const form = useForm<ActivityFormData>({
    defaultValues: getDefaultFormValues() as ActivityFormData,
  });

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly,
          canViewFieldScope: () => true,
          canEditFieldScope: canEditFieldScope ?? (() => true),
        }}
      >
        <ActivityReleaseSection
          newsReleaseDistributionOptions={mockLookups.newsReleaseDistributions}
          newsReleaseOriginOptions={mockLookups.newsReleaseOrigins}
          translationRequiredStatuses={mockLookups.translationRequiredStatuses}
          translationLanguageOptions={mockLookups.translationLanguages}
        />
      </ActivityEditProvider>
    </FormProvider>
  );
}

describe('ActivityReleaseSection permissions', () => {
  it('renders news release selects as readOnly when activity is view-only', async () => {
    render(<ActivityReleaseSectionHarness readOnly={true} />);

    const placeholder = await screen.findByText(/Select news release origin/i);
    const origin = placeholder.closest('button[role="combobox"]');
    expect(origin).toHaveAttribute('aria-readonly', 'true');
  });

  it('disables translation languages when field scope forbids edit', async () => {
    render(
      <ActivityReleaseSectionHarness
        readOnly={false}
        canEditFieldScope={(s: string) => s !== 'translations'}
      />
    );

    const input = await screen.findByPlaceholderText(
      /Select translation languages/i
    );
    expect(input).toBeDisabled();
  });
});
