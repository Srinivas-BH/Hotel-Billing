'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem } from '@/types';

interface MenuAutocompleteProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  placeholder?: string;
  className?: string;
}

export function MenuAutocomplete({
  items,
  onSelect,
  placeholder = 'Search menu items...',
  className = '',
}: MenuAutocompleteProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [cachedItems, setCachedItems] = useState<MenuItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cache menu data locally if more than 50 items
  useEffect(() => {
    if (items.length > 50) {
      setCachedItems(items);
    }
  }, [items]);

  // Use cached items if available, otherwise use props
  const menuItems = cachedItems.length > 0 ? cachedItems : items;

  // Filter items with case-insensitive substring matching
  const filteredItems = useMemo(() => {
    if (!input.trim()) return [];

    const searchTerm = input.toLowerCase();
    return menuItems.filter((item) =>
      item.dishName.toLowerCase().includes(searchTerm)
    );
  }, [input, menuItems]);

  // Debounced input handler (300ms)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setInput(value);
      setIsOpen(value.trim().length > 0);
      setHighlightedIndex(0);
    }, 300);
  };

  // Handle item selection
  const handleSelect = (item: MenuItem) => {
    onSelect(item);
    setInput('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[highlightedIndex]) {
          handleSelect(filteredItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => input.trim() && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
      />

      {isOpen && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{item.dishName}</span>
                <span className="text-gray-600">${item.price.toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && input.trim() && filteredItems.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4"
        >
          <p className="text-gray-500 text-sm">No items found</p>
        </div>
      )}
    </div>
  );
}
