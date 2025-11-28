/**
 * Unit tests for menu components
 * Requirements: 3.4, 12.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MenuList } from '@/components/MenuList';
import { MenuItemForm } from '@/components/MenuItemForm';
import { MenuAutocomplete } from '@/components/MenuAutocomplete';
import { useAuth } from '@/contexts/AuthContext';
import { MenuItem } from '@/types';

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('MenuList', () => {
  const mockItems: MenuItem[] = [
    {
      id: '1',
      hotelId: 'hotel-1',
      dishName: 'Pasta',
      price: 12.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      hotelId: 'hotel-1',
      dishName: 'Pizza',
      price: 15.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      hotelId: 'hotel-1',
      dishName: 'Burger',
      price: 9.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all menu items with dish names and prices', () => {
    render(<MenuList items={mockItems} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('$12.99')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('displays empty state when no items exist', () => {
    render(<MenuList items={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/no menu items yet/i)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<MenuList items={mockItems} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButtons = screen.getAllByLabelText(/edit/i);
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockItems[0]);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('shows delete confirmation when delete button is clicked', () => {
    render(<MenuList items={mockItems} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/delete this item/i)).toBeInTheDocument();
    const confirmDeleteButton = screen.getAllByRole('button', { name: /^delete$/i })[0];
    expect(confirmDeleteButton).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', () => {
    render(<MenuList items={mockItems} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByLabelText(/delete pasta/i);
    fireEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('cancels delete when cancel button is clicked', () => {
    render(<MenuList items={mockItems} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText(/delete this item/i)).not.toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('renders edit and delete buttons for each item', () => {
    render(<MenuList items={mockItems} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButtons = screen.getAllByLabelText(/edit/i);
    const deleteButtons = screen.getAllByLabelText(/delete/i);

    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });
});

describe('MenuItemForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ token: mockToken });
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders form with dish name and price inputs', () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/dish name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('displays "Add Menu Item" title when creating new item', () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText('Add Menu Item')).toBeInTheDocument();
  });

  it('displays "Edit Menu Item" title when editing existing item', () => {
    const existingItem: MenuItem = {
      id: '1',
      hotelId: 'hotel-1',
      dishName: 'Pasta',
      price: 12.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<MenuItemForm item={existingItem} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText('Edit Menu Item')).toBeInTheDocument();
  });

  it('pre-fills form with existing item data when editing', () => {
    const existingItem: MenuItem = {
      id: '1',
      hotelId: 'hotel-1',
      dishName: 'Pasta',
      price: 12.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<MenuItemForm item={existingItem} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const dishNameInput = screen.getByLabelText(/dish name/i) as HTMLInputElement;
    const priceInput = screen.getByLabelText(/price/i) as HTMLInputElement;

    expect(dishNameInput.value).toBe('Pasta');
    expect(priceInput.value).toBe('12.99');
  });

  it('displays validation error for empty dish name', async () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const priceInput = screen.getByLabelText(/price/i);
    const submitButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(priceInput, { target: { value: '10.99' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/dish name is required/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('displays validation error for empty price', async () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const dishNameInput = screen.getByLabelText(/dish name/i);
    const submitButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(dishNameInput, { target: { value: 'Pasta' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Zod returns "Expected number, received nan" for empty number fields
      expect(screen.getByText(/expected number|price must be a positive number/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits form with valid data for new item', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ item: { id: '1', dishName: 'Pasta', price: 12.99 } }),
    });

    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const dishNameInput = screen.getByLabelText(/dish name/i);
    const priceInput = screen.getByLabelText(/price/i);
    const submitButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(dishNameInput, { target: { value: 'Pasta' } });
    fireEvent.change(priceInput, { target: { value: '12.99' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ dishName: 'Pasta', price: 12.99 }),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('submits form with valid data for editing item', async () => {
    const existingItem: MenuItem = {
      id: '1',
      hotelId: 'hotel-1',
      dishName: 'Pasta',
      price: 12.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ item: { id: '1', dishName: 'Updated Pasta', price: 14.99 } }),
    });

    render(<MenuItemForm item={existingItem} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const dishNameInput = screen.getByLabelText(/dish name/i);
    const priceInput = screen.getByLabelText(/price/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    fireEvent.change(dishNameInput, { target: { value: 'Updated Pasta' } });
    fireEvent.change(priceInput, { target: { value: '14.99' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/menu/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ dishName: 'Updated Pasta', price: 14.99 }),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message on submission failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to save menu item' }),
    });

    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const dishNameInput = screen.getByLabelText(/dish name/i);
    const priceInput = screen.getByLabelText(/price/i);
    const submitButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(dishNameInput, { target: { value: 'Pasta' } });
    fireEvent.change(priceInput, { target: { value: '12.99' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save menu item/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel when close button is clicked', () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables submit button while submitting', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const dishNameInput = screen.getByLabelText(/dish name/i);
    const priceInput = screen.getByLabelText(/price/i);
    const submitButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(dishNameInput, { target: { value: 'Pasta' } });
    fireEvent.change(priceInput, { target: { value: '12.99' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });
});

describe('MenuAutocomplete', () => {
  const mockItems: MenuItem[] = [
    {
      id: '1',
      hotelId: 'hotel-1',
      dishName: 'Pasta Carbonara',
      price: 12.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      hotelId: 'hotel-1',
      dishName: 'Pizza Margherita',
      price: 15.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      hotelId: 'hotel-1',
      dishName: 'Burger Deluxe',
      price: 9.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      hotelId: 'hotel-1',
      dishName: 'Caesar Salad',
      price: 8.99,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders input field with placeholder', () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    expect(screen.getByPlaceholderText(/search menu items/i)).toBeInTheDocument();
  });

  it('renders input field with custom placeholder', () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} placeholder="Find a dish..." />);

    expect(screen.getByPlaceholderText('Find a dish...')).toBeInTheDocument();
  });

  it('filters items using case-insensitive substring matching', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'pasta' } });

    // Fast-forward debounce timer
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    expect(screen.queryByText('Pizza Margherita')).not.toBeInTheDocument();
  });

  it('filters items with uppercase input', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'PIZZA' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    });
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });

  it('filters items with partial substring', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'burg' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Burger Deluxe')).toBeInTheDocument();
    });
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });

  it('shows multiple matching items', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'a' } });

    jest.advanceTimersByTime(300);

    // All items contain 'a'
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
  });

  it('displays "No items found" when no matches exist', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'xyz' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });
  });

  it('does not show dropdown when input is empty', () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: '' } });

    jest.advanceTimersByTime(300);

    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });

  it('calls onSelect when item is clicked', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'pasta' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    const item = screen.getByText('Pasta Carbonara');
    fireEvent.click(item);

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('clears input after item selection', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'pasta' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    const item = screen.getByText('Pasta Carbonara');
    fireEvent.click(item);

    expect(input.value).toBe('');
  });

  it('closes dropdown after item selection', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'pasta' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    const item = screen.getByText('Pasta Carbonara');
    fireEvent.click(item);

    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });

  it('displays item prices in dropdown', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'pasta' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('$12.99')).toBeInTheDocument();
    });
  });

  it('debounces input changes by 300ms', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'p' } });

    // Before debounce completes
    jest.advanceTimersByTime(100);
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();

    // After debounce completes
    jest.advanceTimersByTime(200);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation with arrow keys', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'a' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Arrow down
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Arrow up
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    // Should not throw errors
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });

  it('selects item on Enter key press', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'pasta' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('closes dropdown on Escape key press', async () => {
    render(<MenuAutocomplete items={mockItems} onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/search menu items/i);
    fireEvent.change(input, { target: { value: 'pasta' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });
});
