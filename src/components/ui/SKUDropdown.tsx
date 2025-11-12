import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconX, IconLoader2 } from '@tabler/icons-react';
import { useSKUInfinite, useDebounce } from '../../hooks';
import type { SKUItem, SKUQueryParams } from '../../types/common';

interface SKUDropdownProps {
  value?: SKUItem | null;
  onChange: (item: SKUItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  filters?: Partial<SKUQueryParams>;
}

const SKUDropdown: React.FC<SKUDropdownProps> = ({
  value,
  onChange,
  placeholder = "Search SKU items...",
  disabled = false,
  className = "",
  error,
  filters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const {
    data: searchResults,
    isLoading,
    error: searchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSKUInfinite(
    {
      ...filters,
      search: debouncedSearchQuery.trim() || undefined,
    },
    20
  );

  const items = searchResults?.pages?.flatMap(page => page.data.items) || [];
  const totalItems = searchResults?.pages?.[0]?.data.pagination?.total_items || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setIsFocused(false);
          break;
        case 'Enter':
          if (items.length > 0) {
            handleSelectItem(items[0]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items]);

  const handleSelectItem = (item: SKUItem) => {
    onChange(item);
    setSearchQuery('');
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
  };

  const handleDropdownClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsFocused(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 16;
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value ? `${value.hsn_code ? value.hsn_code + ' - ' : ''}${value.category || value.description}` : searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full px-3 py-2.5 pr-10 text-sm border rounded-md transition-colors
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              ${isFocused ? 'border-green-default ring-1 ring-green-default' : 'border-gray-300'}
              ${error ? 'border-red-500' : ''}
              focus:outline-none focus:ring-2 focus:ring-green-default focus:border-transparent
            `}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {isLoading ? (
              <IconLoader2 className="w-4 h-4 text-gray-light animate-spin" />
            ) : value ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <IconX className="w-4 h-4 text-gray-light" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDropdownClick}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <IconChevronDown className="w-4 h-4 text-gray-light" />
              </button>
            )}
          </div>
        </div>

        {isOpen && !value && (
          <div
            className="absolute z-[70] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-auto"
            onScroll={handleScroll}
            ref={listRef}
          >
            {isLoading && items.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-light text-center">
                <div className="flex items-center justify-center gap-2">
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  Loading items...
                </div>
              </div>
            ) : (
              <>
                {searchQuery && (
                  <div className="px-3 py-2 text-sm text-gray-light border-b bg-gray-50">
                    {isLoading && items.length === 0 ? 'Searching...' : `Found ${totalItems} items`}
                  </div>
                )}
                
                {!searchQuery && (
                  <div className="px-3 py-2 text-sm text-gray-light border-b bg-gray-50">
                    {isLoading ? 'Loading items...' : `Showing ${items.length} of ${totalItems} items`}
                  </div>
                )}
                
                {searchError && (
                  <div className="px-3 py-2 text-sm text-red-500 bg-red-50">
                    {searchError.message || 'An error occurred while searching'}
                  </div>
                )}

                {items.length === 0 && !isLoading && !searchError && (
                  <div className="px-3 py-4 text-sm text-gray-light text-center">
                    {searchQuery ? 'No items found' : 'No items available'}
                  </div>
                )}

                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-dark">
                          {item.hsn_code}
                        </span>
                        <span className="text-sm font-medium text-green-default">
                          {formatPrice(item.display_price)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-light truncate">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-light">
                          {item.brand} • {item.description}
                        </span>
                        {item.size && (
                          <span className="text-xs text-gray-light">
                            • {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {isFetchingNextPage && (
                  <div className="px-3 py-3 text-sm text-gray-light text-center">
                    <div className="flex items-center justify-center gap-2">
                      <IconLoader2 className="w-4 h-4 animate-spin" />
                      Loading more...
                    </div>
                  </div>
                )}
                {!isFetchingNextPage && hasNextPage && (
                  <div className="px-3 py-3 text-xs text-gray-light text-center">
                    Scroll to load more
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default SKUDropdown; 