import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FreeformCombobox } from './freeform-combobox';
import type { FreeformComboboxValue } from './freeform-combobox';

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

  describe('Rendering', () => {
    it('renders with placeholder when no value is selected', () => {
      render(<FreeformCombobox {...defaultProps} />);
      expect(screen.getByRole('combobox')).toHaveTextContent(
        'Select an option...'
      );
    });

    it('renders with custom placeholder', () => {
      render(
        <FreeformCombobox {...defaultProps} placeholder="Choose an option" />
      );
      expect(screen.getByRole('combobox')).toHaveTextContent(
        'Choose an option'
      );
    });

    it('renders selected option label', () => {
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      expect(screen.getByRole('combobox')).toHaveTextContent('Option 1');
    });

    it('renders freeform value', () => {
      const value: FreeformComboboxValue = {
        type: 'freeform',
        value: 'Custom Value',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      expect(screen.getByRole('combobox')).toHaveTextContent('Custom Value');
    });

    it('shows custom value indicator when freeform is selected', () => {
      const value: FreeformComboboxValue = {
        type: 'freeform',
        value: 'My Custom Value',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      expect(screen.getByText(/Custom value:/)).toHaveTextContent(
        'Custom value: "My Custom Value"'
      );
    });

    it('does not show custom value indicator when option is selected', () => {
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };
      render(<FreeformCombobox {...defaultProps} value={value} />);
      expect(screen.queryByText(/Custom value:/)).not.toBeInTheDocument();
    });

    it('renders with disabled state', () => {
      render(<FreeformCombobox {...defaultProps} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Option Selection', () => {
    it('calls onChange with option type when an option is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      expect(onChange).toHaveBeenCalledWith({
        type: 'option',
        value: 'option1',
      });
    });

    it('closes popover after selecting an option', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    it('shows checkmark for selected option', async () => {
      const user = userEvent.setup();
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option2',
      };

      render(<FreeformCombobox {...defaultProps} value={value} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        // Find the option in the dropdown (not the button)
        const options = screen.getAllByText('Option 2');
        const optionInDropdown = options.find((el) =>
          el.closest('[role="option"]')
        );
        expect(optionInDropdown).toBeInTheDocument();
        const checkIcon = optionInDropdown
          ?.closest('[role="option"]')
          ?.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
        // Check that the check icon has opacity-100 class (visible)
        expect(checkIcon).toHaveClass('opacity-100');
      });
    });
  });

  describe('Freeform Input', () => {
    it('shows freeform option when typing non-matching text', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Custom Text');

      await waitFor(() => {
        expect(screen.getByText(/Other:/)).toBeInTheDocument();
        expect(screen.getByText(/"Custom Text"/)).toBeInTheDocument();
      });
    });

    it('calls onChange with freeform type when freeform option is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'My Custom Value');

      await waitFor(() => {
        expect(screen.getByText(/Other:/)).toBeInTheDocument();
      });

      const freeformOption = screen.getByText(/Other:/);
      await user.click(freeformOption);

      expect(onChange).toHaveBeenCalledWith({
        type: 'freeform',
        value: 'My Custom Value',
      });
    });

    it('does not show freeform option when there is an exact match', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Option 1');

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Other:/)).not.toBeInTheDocument();
    });

    it('trims freeform value before calling onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FreeformCombobox {...defaultProps} onChange={onChange} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, '  Trimmed Value  ');

      await waitFor(() => {
        expect(screen.getByText(/Other:/)).toBeInTheDocument();
      });

      const freeformOption = screen.getByText(/Other:/);
      await user.click(freeformOption);

      expect(onChange).toHaveBeenCalledWith({
        type: 'freeform',
        value: 'Trimmed Value',
      });
    });

    it('uses custom freeform label and description', async () => {
      const user = userEvent.setup();

      render(
        <FreeformCombobox
          {...defaultProps}
          freeformLabel="Custom"
          freeformDescription="Enter custom value"
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Test');

      await waitFor(() => {
        expect(screen.getByText(/Custom:/)).toBeInTheDocument();
        expect(screen.getByText('Enter custom value')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters options based on search input', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Option 2');

      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
      });
    });

    it('shows empty message when no options match and search is empty', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} options={[]} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

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

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('No options available')).toBeInTheDocument();
      });
    });

    it('filters case-insensitively', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'option 1');

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });
  });

  describe('Clear Selection', () => {
    it('shows clear option when a value is selected', async () => {
      const user = userEvent.setup();
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };

      render(<FreeformCombobox {...defaultProps} value={value} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Clear selection')).toBeInTheDocument();
      });
    });

    it('calls onChange with null when clear is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: FreeformComboboxValue = {
        type: 'option',
        value: 'option1',
      };

      render(
        <FreeformCombobox {...defaultProps} value={value} onChange={onChange} />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Clear selection')).toBeInTheDocument();
      });

      const clearOption = screen.getByText('Clear selection');
      await user.click(clearOption);

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('does not show clear option when no value is selected', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Clear selection')).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('uses custom search placeholder', async () => {
      const user = userEvent.setup();

      render(
        <FreeformCombobox
          {...defaultProps}
          searchPlaceholder="Type to search..."
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(
        screen.getByPlaceholderText('Type to search...')
      ).toBeInTheDocument();
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

      // Should show placeholder when option is not found
      expect(screen.getByRole('combobox')).toHaveTextContent(
        'Select an option...'
      );
    });

    it('handles empty options array', () => {
      render(<FreeformCombobox {...defaultProps} options={[]} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('does not show freeform option when search is only whitespace', async () => {
      const user = userEvent.setup();

      render(<FreeformCombobox {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, '   ');

      await waitFor(() => {
        expect(screen.queryByText(/Other:/)).not.toBeInTheDocument();
      });
    });
  });
});
