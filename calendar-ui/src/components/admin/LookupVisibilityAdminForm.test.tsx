import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  LookupVisibilityAdminForm,
  lookupVisibilityInitialData,
  transformLookupVisibilitySubmitData,
} from './LookupVisibilityAdminForm';

const baseFields = [
  { name: 'name', label: 'Name', type: 'text' as const },
  { name: 'sortOrder', label: 'Sort order', type: 'number' as const },
];

describe('LookupVisibilityAdminForm', () => {
  it('transformLookupVisibilitySubmitData rejects team visibility without teams', () => {
    expect(() =>
      transformLookupVisibilitySubmitData({
        name: 'Scoped',
        visibility: 'team',
        teamIds: [],
      })
    ).toThrow('At least one team is required when visibility is team');
  });

  it('resets visibility fields when resetKey changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <LookupVisibilityAdminForm
        resetKey="edit-1"
        initialData={lookupVisibilityInitialData({
          name: 'One',
          sortOrder: 1,
          visibility: 'team',
          teamIds: [10],
        })}
        onChange={onChange}
        isSubmitting={false}
        fields={baseFields}
        teamOptions={[{ value: '10', label: 'Team A' }]}
      />
    );

    rerender(
      <LookupVisibilityAdminForm
        resetKey="edit-2"
        initialData={lookupVisibilityInitialData({
          name: 'Two',
          sortOrder: 2,
          visibility: 'global',
          teamIds: [],
        })}
        onChange={onChange}
        isSubmitting={false}
        fields={baseFields}
        teamOptions={[{ value: '10', label: 'Team A' }]}
      />
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Two',
        visibility: 'global',
        teamIds: [],
      })
    );
  });
});
