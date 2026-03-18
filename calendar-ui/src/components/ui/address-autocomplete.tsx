import React, { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ADDRESS_RETRIEVE_FAILED,
  ADDRESS_SEARCH_FAILED,
} from '@/lib/error-messages';
import { getFriendlyErrorMessage } from '@/lib/error-toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AddressAutocomplete');

export interface AddressData {
  street: string;
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

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  /** Initial value when uncontrolled */
  defaultValue?: string;
  /** When provided, syncs the input display from parent (e.g. after quick-pick selection). Uncontrolled when omitted. */
  value?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  defaultValue = '',
  value: valueProp,
  placeholder = 'Start typing an address...',
  label = 'Address',
  required = false,
  disabled = false,
  className = '',
}) => {
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When parent provides value (e.g. after quick-pick), sync the input display
  useEffect(() => {
    if (valueProp !== undefined) {
      setSearchTerm(valueProp);
    }
  }, [valueProp]);

  // Close dropdown when clicking outside
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

  // Debounced search function
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

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void searchAddresses(value);
    }, 300);
  };

  // Retrieve full address details
  const retrieveAddress = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lookups/address/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(ADDRESS_RETRIEVE_FAILED);
      }

      const result = await response.json();
      const addressData: AddressData = result.data;

      onAddressSelect(addressData);
      setSearchTerm(addressData.street);
      setShowDropdown(false);
      setSuggestions([]);
    } catch (err) {
      logger.error('Address retrieve error', err);
      setError(getFriendlyErrorMessage(err) || ADDRESS_RETRIEVE_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click or selection
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    if (suggestion.Next === 'Retrieve') {
      await retrieveAddress(suggestion.Id);
    } else {
      // This is a container (like a street name that needs further refinement)
      setSearchTerm(suggestion.Text);
      await searchAddresses(suggestion.Text);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="space-y-2">
        {label && (
          <Label htmlFor="address-autocomplete">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
        )}
        <Input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
          autoComplete="off"
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="popover-list-scroll absolute z-50 mt-1 max-h-[var(--popover-list-max-height)] w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
          {isLoading && (
            <div className="p-2 text-center text-sm text-gray-500">
              Loading...
            </div>
          )}
          {!isLoading &&
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion.Id}
                className={`cursor-pointer p-2 hover:bg-gray-100 ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
                onClick={() => {
                  void handleSuggestionSelect(suggestion);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="text-sm font-medium">{suggestion.Text}</div>
                {suggestion.Description && (
                  <div className="text-xs text-gray-500">
                    {suggestion.Description}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
