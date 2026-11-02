import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from './combobox';

const teamOptions = [
  { value: '1', label: 'Team A' },
  { value: '2', label: 'Team B' },
];

describe('Combobox invalid styling', () => {
  it('forwards aria-invalid from root to ComboboxInput InputGroup', () => {
    render(
      <Combobox
        items={teamOptions}
        value={null}
        onValueChange={() => {}}
        itemToStringValue={(option) => option.label}
        aria-invalid={true}
      >
        <ComboboxInput placeholder="Lead team" />
        <ComboboxContent>
          <ComboboxEmpty>No teams found.</ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );

    const inputGroup = document.querySelector('[data-slot="input-group"]');
    expect(inputGroup).toHaveAttribute('aria-invalid', 'true');
  });
});
