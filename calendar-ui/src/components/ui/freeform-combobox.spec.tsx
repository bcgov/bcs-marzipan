import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FreeformCombobox,
  type FreeformComboboxItemWithLead,
  type FreeformComboboxValue,
} from './freeform-combobox';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('FreeformCombobox', () => {
  const defaultProps = {
    options: mockOptions,
    value: null,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Opens the popover by clicking the trigger button (reliable in jsdom) */
  async function openPopover(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Open' }));
  }

  function freeformOption(name: string | RegExp) {
    return screen.getByRole('option', { name });
  }

  async function openChipPopover(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('textbox'));
  }

  describe('Rendering', () => {
    it('renders with custom placeholder', () => {
      render(
        <FreeformCombobox {...defaultProps} placeholder="Choose an option" />
      );
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'placeholder',
        'Choose an option'
      );
    });

    it('renders selected option label', () => {
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      expect(screen.getByRole('combobox')).toHaveDisplayValue('Option 1');
    });

    it('renders freeform value', () => {
      const value: FreeformComboboxValue = {
        type: 'freeform',
        value: 'Custom Value',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      expect(screen.getByRole('combobox')).toHaveDisplayValue('Custom Value');
    });

    it('displays freeform value in the input when freeform is selected', () => {
      const value: FreeformComboboxValue = {
        type: 'freeform',
        value: 'My Custom Value',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveDisplayValue('My Custom Value');
    });

    it('displays option label in the input when option is selected', () => {
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveDisplayValue('Option 1');
    });

    it('renders with disabled state', () => {
      render(<FreeformCombobox {...defaultProps} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('readOnly keeps native control enabled but sets readonly (no muted disabled styling)', () => {
      render(<FreeformCombobox {...defaultProps} readOnly />);
      const combobox = screen.getByRole('combobox');
      expect(combobox).not.toBeDisabled();
      expect(combobox).toHaveAttribute('readonly');
    });

    it('readOnly hides the dropdown chevron and does not show the option list', () => {
      render(<FreeformCombobox {...defaultProps} readOnly />);
      expect(
        screen.queryByRole('button', { name: 'Open' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Close' })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('readOnly hides chip remove buttons in multiple mode', () => {
      const value: FreeformComboboxItemWithLead[] = [
        { type: 'option', value: 'option1', isLead: true },
      ];
      render(
        <FreeformCombobox {...defaultProps} multiple value={value} readOnly />
      );
      expect(screen.queryByLabelText('Remove')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search...')).toHaveAttribute(
        'readonly'
      );
    });
  });

  describe('Option Selection', () => {
    it('calls onChange with option type when an option is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      await openPopover(user);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 1' })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Option 1' }));

      expect(onChange).toHaveBeenCalledWith({
        type: 'option',
        value: 'option1',
      });
    });

    it('closes popover after selecting an option', async () => {
      const user = userEvent.setup();
      let value: FreeformComboboxValue = null;
      const onChange = vi.fn(
        (v: FreeformComboboxValue | FreeformComboboxValue[] | null) => {
          value = Array.isArray(v) ? (v[0] ?? null) : v;
        }
      );

      const { rerender } = render(
        <FreeformCombobox {...defaultProps} value={value} onChange={onChange} />
      );

      await openPopover(user);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 1' })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Option 1' }));

      expect(onChange).toHaveBeenCalledWith({
        type: 'option',
        value: 'option1',
      });

      rerender(
        <FreeformCombobox
          {...defaultProps}
          value={{ type: 'option', value: 'option1' }}
          onChange={onChange}
        />
      );

      expect(screen.getByRole('combobox')).toHaveDisplayValue('Option 1');
    });

    it('shows checkmark for selected option', async () => {
      const user = userEvent.setup();
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option2',
      };

      render(<FreeformCombobox {...defaultProps} value={value} />);

      await openPopover(user);

      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Option 2' });
        const checkIcon = option.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
        expect(checkIcon).toHaveClass('opacity-100');
      });
    });
  });

  describe('Freeform Input', () => {
    it('shows freeform option when typing non-matching text', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.click(comboboxInput);
      await user.type(comboboxInput, 'Custom Text');

      await waitFor(() => {
        expect(
          freeformOption(/Custom Text.*Add custom value/i)
        ).toBeInTheDocument();
      });
    });

    it('calls onChange with freeform type when freeform option is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.click(comboboxInput);
      await user.type(comboboxInput, 'My Custom Value');

      await waitFor(() => {
        expect(
          freeformOption(/My Custom Value.*Add custom value/i)
        ).toBeInTheDocument();
      });

      await user.click(freeformOption(/My Custom Value.*Add custom value/i));

      expect(onChange).toHaveBeenCalledWith({
        type: 'freeform',
        value: 'My Custom Value',
      });
    });

    it('does not show freeform option when there is an exact match', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.click(comboboxInput);
      await user.type(comboboxInput, 'Option 1');

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 1' })
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('option', { name: /Add custom value/i })
      ).not.toBeInTheDocument();
    });

    it('trims freeform value before calling onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, '  Trimmed Value  ');

      await waitFor(() => {
        expect(
          freeformOption(/Trimmed Value.*Add custom value/i)
        ).toBeInTheDocument();
      });

      await user.click(freeformOption(/Trimmed Value.*Add custom value/i));

      expect(onChange).toHaveBeenCalledWith({
        type: 'freeform',
        value: 'Trimmed Value',
      });
    });

    it('uses custom freeform badge label', async () => {
      const user = userEvent.setup();

      render(
        <FreeformCombobox
          {...defaultProps}
          freeformBadgeLabel="Add custom widget"
        />
      );

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Test');

      await waitFor(() => {
        expect(freeformOption(/Test.*Add custom widget/i)).toBeInTheDocument();
      });
    });

    it('announces custom values via aria-live when freeform row appears', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Custom Text');

      await waitFor(() => {
        expect(screen.getByText('Allows custom values')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters options based on search input', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Option 2');

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 2' })
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('option', { name: 'Option 1' })
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('option', { name: 'Option 3' })
        ).not.toBeInTheDocument();
      });
    });

    it('shows empty message when no options match and search is empty', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} options={[]} />);

      await openPopover(user);

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument();
      });
    });

    it('uses custom empty message', async () => {
      const user = userEvent.setup();

      render(
        <FreeformCombobox
          {...defaultProps}
          options={[]}
          emptyMessage="No options available"
        />
      );

      await openPopover(user);

      await waitFor(() => {
        expect(screen.getByText('No options available')).toBeInTheDocument();
      });
    });

    it('filters case-insensitively', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'option 1');

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 1' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Trigger Clear', () => {
    it('shows clear button when a value is selected in single-select mode', () => {
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };

      render(<FreeformCombobox {...defaultProps} value={value} />);

      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('calls onChange with null when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };

      render(
        <FreeformCombobox {...defaultProps} value={value} onChange={onChange} />
      );

      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('does not show clear button when no value is selected', () => {
      render(<FreeformCombobox {...defaultProps} />);

      expect(
        screen.queryByRole('button', { name: 'Clear' })
      ).not.toBeInTheDocument();
    });

    it('does not show clear button in multi-select chip mode', () => {
      const value: FreeformComboboxItemWithLead[] = [
        { type: 'option', value: 'option1' },
      ];

      render(<FreeformCombobox {...defaultProps} multiple value={value} />);

      expect(
        screen.queryByRole('button', { name: 'Clear' })
      ).not.toBeInTheDocument();
    });

    it('does not show clear selection in the dropdown', async () => {
      const user = userEvent.setup();
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };

      render(<FreeformCombobox {...defaultProps} value={value} />);

      await openPopover(user);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 1' })
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('Clear selection')).not.toBeInTheDocument();
    });
  });

  describe('List footer hint', () => {
    it('shows sticky footer when open and input is idle', async () => {
      const user = userEvent.setup();

      render(
        <FreeformCombobox
          {...defaultProps}
          listFooterHint="Custom widget names allowed"
        />
      );

      await openPopover(user);

      expect(screen.getByRole('note')).toHaveTextContent(
        'Custom widget names allowed'
      );
    });

    it('hides footer when user types a non-matching value', async () => {
      const user = userEvent.setup();

      render(
        <FreeformCombobox
          {...defaultProps}
          listFooterHint="Custom widget names allowed"
        />
      );

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Custom Text');

      await waitFor(() => {
        expect(screen.queryByRole('note')).not.toBeInTheDocument();
      });
    });

    it('shows footer when list is empty and no custom row is shown', async () => {
      const user = userEvent.setup();

      render(
        <FreeformCombobox
          {...defaultProps}
          options={[]}
          listFooterHint="Custom widget names allowed"
        />
      );

      await openPopover(user);

      expect(screen.getByRole('note')).toHaveTextContent(
        'Custom widget names allowed'
      );
    });

    it('does not show footer when listFooterHint is omitted', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      await openPopover(user);

      expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });
  });

  describe('Commit on blur', () => {
    it('commits freeform value when typing non-match and tabbing away', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <div>
          <FreeformCombobox {...defaultProps} onChange={onChange} />
          <button type="button">Next field</button>
        </div>
      );

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'My Custom Org');
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          type: 'freeform',
          value: 'My Custom Org',
        });
      });
    });

    it('commits preset when typed text exactly matches a label on blur', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <div>
          <FreeformCombobox {...defaultProps} onChange={onChange} />
          <button type="button">Next field</button>
        </div>
      );

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Option 2');
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          type: 'option',
          value: 'option2',
        });
      });
    });

    it('does not commit when opening and closing without typing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      await openPopover(user);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 1' })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when blur re-commits the same single-select value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };

      render(
        <div>
          <FreeformCombobox
            {...defaultProps}
            value={value}
            onChange={onChange}
          />
          <button type="button">Next field</button>
        </div>
      );

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Option 1');
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not commit when draft is cleared before blur', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <div>
          <FreeformCombobox {...defaultProps} onChange={onChange} />
          <button type="button">Next field</button>
        </div>
      );

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Temporary');
      await user.clear(comboboxInput);
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Commit on blur (multi-select)', () => {
    it('appends freeform value on blur in chip mode', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: FreeformComboboxItemWithLead[] = [
        { type: 'option', value: 'option1' },
      ];

      render(
        <div>
          <FreeformCombobox
            {...defaultProps}
            multiple
            value={value}
            onChange={onChange}
          />
          <button type="button">Next field</button>
        </div>
      );

      await openChipPopover(user);

      const chipInput = screen.getByRole('textbox');
      await user.type(chipInput, 'Custom Planner');
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
          { type: 'option', value: 'option1' },
          { type: 'freeform', value: 'Custom Planner' },
        ]);
      });
    });

    it('appends exact preset match on blur in chip mode', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: FreeformComboboxItemWithLead[] = [
        { type: 'option', value: 'option1' },
      ];

      render(
        <div>
          <FreeformCombobox
            {...defaultProps}
            multiple
            value={value}
            onChange={onChange}
          />
          <button type="button">Next field</button>
        </div>
      );

      await openChipPopover(user);

      const chipInput = screen.getByRole('textbox');
      await user.type(chipInput, 'Option 2');
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
          { type: 'option', value: 'option1' },
          { type: 'option', value: 'option2' },
        ]);
      });
    });

    it('does not append duplicate selection on blur in chip mode', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: FreeformComboboxItemWithLead[] = [
        { type: 'option', value: 'option1' },
      ];

      render(
        <div>
          <FreeformCombobox
            {...defaultProps}
            multiple
            value={value}
            onChange={onChange}
          />
          <button type="button">Next field</button>
        </div>
      );

      await openChipPopover(user);

      const chipInput = screen.getByRole('textbox');
      await user.type(chipInput, 'Option 1');
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard', () => {
    it('commits highlighted freeform row on Enter', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Custom Enter Value');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith({
        type: 'freeform',
        value: 'Custom Enter Value',
      });
    });

    it('discards draft on Escape without calling onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Discarded Value');
      await user.keyboard('{Escape}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('commits draft on blur after Escape and reopen', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <div>
          <FreeformCombobox {...defaultProps} onChange={onChange} />
          <button type="button">Next field</button>
        </div>
      );

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Discarded Value');
      await user.keyboard('{Escape}');

      expect(onChange).not.toHaveBeenCalled();

      await openPopover(user);
      await user.type(comboboxInput, 'Saved Value');
      await user.click(screen.getByRole('button', { name: 'Next field' }));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          type: 'freeform',
          value: 'Saved Value',
        });
      });
    });
  });

  describe('Stale draft state', () => {
    it('shows full preset list after escaping an abandoned draft on reopen', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, 'Unsaved Custom');
      await user.keyboard('{Escape}');

      expect(onChange).not.toHaveBeenCalled();

      await openPopover(user);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: 'Option 1' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: 'Option 2' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: 'Option 3' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Custom Props', () => {
    it('uses custom search placeholder', () => {
      render(
        <FreeformCombobox
          {...defaultProps}
          searchPlaceholder="Type to search..."
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <FreeformCombobox {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles option value that does not exist in options array', () => {
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'nonexistent',
      };

      render(<FreeformCombobox {...defaultProps} value={value} />);

      expect(screen.getByRole('combobox')).toHaveDisplayValue('nonexistent');
    });

    it('handles empty options array', () => {
      render(<FreeformCombobox {...defaultProps} options={[]} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('does not show freeform option when search is only whitespace', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      await openPopover(user);

      const comboboxInput = screen.getByRole('combobox');
      await user.type(comboboxInput, '   ');

      await waitFor(() => {
        expect(
          screen.queryByRole('option', { name: /Add custom value/i })
        ).not.toBeInTheDocument();
      });
    });
  });
});
