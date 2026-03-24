import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from 'react';

import { Input } from '@/components/ui/input';
import {
  ADDRESS_RETRIEVE_FAILED,
  ADDRESS_SEARCH_FAILED,
} from '@/lib/error-messages';
import { getFriendlyErrorMessage } from '@/lib/error-toast';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const logger = createLogger('AddressAutocomplete');

export interface AddressData {
  addressLine1: string;
  city: string;
  province: string;
  provinceCode: string;
  country: string;
  countryCode: string;
  postalCode: string;
}

interface AddressSuggestion {
  Id: string;
  Text: string;
  Highlight: string;
  Cursor: number;
  Description: string;
  Next: string;
}

export type AddressAutocompleteProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'onChange' | 'value' | 'defaultValue' | 'onKeyDown'
> & {
  onAddressSelect: (address: AddressData) => void;
  defaultValue?: string;
  /** When set, keeps the text field in sync with parent (e.g. venue preset). */
  value?: string;
  placeholder?: string;
  /**
   * View-only: full-contrast input; no search/dropdown. Prefer over `disabled`
   * when the field should not look muted.
   */
  readOnly?: boolean;
  /** Root wrapper (dropdown is absolutely positioned under the input). */
  className?: string;
  /**
   * Called on input blur with the trimmed value, or `null` when empty.
   * Use to sync free typing / clear-without-pick to controlled parents (e.g. RHF).
   */
  onBlurCommit?: (value: string | null) => void;
  /** Raw input value on each change (after local state updates). Keeps RHF in sync before blur. */
  onInputValueChange?: (value: string) => void;
};

export const AddressAutocomplete = forwardRef<
  HTMLInputElement,
  AddressAutocompleteProps
>(function AddressAutocomplete(
  {
    onAddressSelect,
    defaultValue = '',
    value: valueProp,
    placeholder = 'Start typing an address...',
    disabled = false,
    readOnly = false,
    className,
    id = 'address-autocomplete',
    onBlurCommit,
    onInputValueChange,
    onBlur: onBlurFromProps,
    ...restInputProps
  },
  ref
) {
  const isMuted = Boolean(disabled);
  const viewOnly = Boolean(readOnly) && !isMuted;
  const [searchTerm, setSearchTerm] = useState(
    valueProp !== undefined ? valueProp : defaultValue
  );
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (valueProp !== undefined) {
      setSearchTerm(valueProp);
    }
  }, [valueProp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (term: string) => {
    if (term.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lookups/address/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: term,
          country: 'CAN',
        }),
      });

      if (!response.ok) {
        throw new Error(ADDRESS_SEARCH_FAILED);
      }

      const result = await response.json();
      setSuggestions(result.data || []);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (err) {
      logger.error('Address search error', err);
      setError(getFriendlyErrorMessage(err) || ADDRESS_SEARCH_FAILED);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (viewOnly) return;
    const value = e.target.value;
    setSearchTerm(value);
    onInputValueChange?.(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void searchAddresses(value);
    }, 300);
  };

  const retrieveAddress = async (retrieveId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lookups/address/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: retrieveId }),
      });

      if (!response.ok) {
        throw new Error(ADDRESS_RETRIEVE_FAILED);
      }

      const result = await response.json();
      const addressData: AddressData = result.data;

      onAddressSelect(addressData);
      setSearchTerm(addressData.addressLine1);
      setShowDropdown(false);
      setSuggestions([]);
    } catch (err) {
      logger.error('Address retrieve error', err);
      setError(getFriendlyErrorMessage(err) || ADDRESS_RETRIEVE_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    if (suggestion.Next === 'Retrieve') {
      await retrieveAddress(suggestion.Id);
    } else {
      setSearchTerm(suggestion.Text);
      await searchAddresses(suggestion.Text);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (viewOnly) return;
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          void handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <Input
        {...restInputProps}
        ref={setInputRef}
        id={id}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onBlurFromProps?.(e);
          const trimmed = searchTerm.trim();
          onBlurCommit?.(trimmed === '' ? null : trimmed);
        }}
        placeholder={placeholder}
        readOnly={viewOnly}
        disabled={isMuted}
        autoComplete="off"
        className="w-full"
      />
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}

      {!viewOnly && showDropdown && suggestions.length > 0 && (
        <div className="popover-list-scroll absolute z-50 mt-1 max-h-(--popover-list-max-height) w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
          {isLoading && (
            <div className="p-2 text-center text-sm text-gray-500">
              Loading...
            </div>
          )}
          {!isLoading &&
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion.Id}
                className={cn(
                  'cursor-pointer p-2 hover:bg-gray-100',
                  index === selectedIndex && 'bg-gray-100'
                )}
                onClick={() => {
                  void handleSuggestionSelect(suggestion);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="text-sm font-medium">{suggestion.Text}</div>
                {suggestion.Description ? (
                  <div className="text-xs text-gray-500">
                    {suggestion.Description}
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      )}
    </div>
  );
});

AddressAutocomplete.displayName = 'AddressAutocomplete';
