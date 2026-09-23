import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared';

import {
  defaultHistoryAudienceForUser,
  HistoryAudienceSelector,
} from './HistoryAudienceSelector';

describe('defaultHistoryAudienceForUser', () => {
  it('defaults to public for editors without audience permissions', () => {
    expect(defaultHistoryAudienceForUser([])).toBe('public');
  });

  it('defaults to internal when internal permission is held', () => {
    expect(
      defaultHistoryAudienceForUser([
        PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_INTERNAL,
      ])
    ).toBe('internal');
  });
});

describe('HistoryAudienceSelector', () => {
  it('renders nothing when the user cannot select audience', () => {
    const { container } = render(
      <HistoryAudienceSelector
        permissions={[]}
        value="public"
        onChange={() => undefined}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders visibility control when internal permission is held', () => {
    render(
      <HistoryAudienceSelector
        permissions={[PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_INTERNAL]}
        value="internal"
        onChange={() => undefined}
        id="test-audience"
      />
    );
    expect(screen.getByLabelText('History visibility')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'History visibility' })
    ).toBeInTheDocument();
  });
});
