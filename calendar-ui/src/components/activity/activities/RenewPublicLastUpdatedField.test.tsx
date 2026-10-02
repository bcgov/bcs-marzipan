import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared';

import { RenewPublicLastUpdatedField } from './RenewPublicLastUpdatedField';

describe('RenewPublicLastUpdatedField', () => {
  it('renders nothing when the user lacks defer permission', () => {
    const { container } = render(
      <RenewPublicLastUpdatedField
        permissions={['activities.edit']}
        checked={false}
        onCheckedChange={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders checkbox when the user has defer permission', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <RenewPublicLastUpdatedField
        permissions={[PERMISSIONS.ACTIVITIES.PUBLIC_LAST_UPDATED_DEFER]}
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /Update public "Last updated" timestamp/i,
    });
    await user.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
