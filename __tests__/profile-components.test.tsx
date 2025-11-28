/**
 * Unit tests for profile components
 * Requirements: 15.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileForm } from '@/components/ProfileForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ProfileForm', () => {
  const mockToken = 'test-token';
  const mockUser = {
    id: '1',
    email: 'test@hotel.com',
    hotelName: 'Grand Hotel',
    tableCount: 20,
    hotelPhotoKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: mockToken,
      user: mockUser,
    });
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders profile form with hotel name and table count fields', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          id: '1',
          email: 'test@hotel.com',
          hotelName: 'Grand Hotel',
          tableCount: 20,
          hotelPhotoKey: null,
          photoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/hotel name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of tables/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hotel photo/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  it('displays validation error for empty hotel name', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          id: '1',
          email: 'test@hotel.com',
          hotelName: 'Grand Hotel',
          tableCount: 20,
          hotelPhotoKey: null,
          photoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/hotel name/i)).toBeInTheDocument();
    });

    const hotelNameInput = screen.getByLabelText(/hotel name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(hotelNameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/hotel name is required/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid table count', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          id: '1',
          email: 'test@hotel.com',
          hotelName: 'Grand Hotel',
          tableCount: 20,
          hotelPhotoKey: null,
          photoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/number of tables/i)).toBeInTheDocument();
    });

    const tableCountInput = screen.getByLabelText(/number of tables/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    // Clear the input first to trigger validation (NaN error)
    fireEvent.change(tableCountInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Zod shows "Expected number, received nan" for empty number fields
      expect(screen.getByText(/expected number/i)).toBeInTheDocument();
    });
  });

  it('prevents submission with multiple validation errors', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          id: '1',
          email: 'test@hotel.com',
          hotelName: 'Grand Hotel',
          tableCount: 20,
          hotelPhotoKey: null,
          photoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    render(<ProfileForm />);

    await waitFor(() => {
      const hotelNameInput = screen.getByLabelText(/hotel name/i) as HTMLInputElement;
      expect(hotelNameInput.value).toBe('Grand Hotel');
    });

    const hotelNameInput = screen.getByLabelText(/hotel name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    // Clear hotel name to trigger validation
    fireEvent.change(hotelNameInput, { target: { value: '' } });
    fireEvent.blur(hotelNameInput);
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should show validation error
      expect(screen.getByText(/hotel name is required/i)).toBeInTheDocument();
      // The API should not have been called (only the initial profile fetch)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('submits profile update successfully', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            id: '1',
            email: 'test@hotel.com',
            hotelName: 'Grand Hotel',
            tableCount: 20,
            hotelPhotoKey: null,
            photoUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            id: '1',
            email: 'test@hotel.com',
            hotelName: 'Updated Hotel',
            tableCount: 25,
            hotelPhotoKey: null,
            photoUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/hotel name/i)).toBeInTheDocument();
    });

    const hotelNameInput = screen.getByLabelText(/hotel name/i);
    const tableCountInput = screen.getByLabelText(/number of tables/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(hotelNameInput, { target: { value: 'Updated Hotel' } });
    fireEvent.change(tableCountInput, { target: { value: '25' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({
            hotelName: 'Updated Hotel',
            tableCount: 25,
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('displays error message when profile update fails', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            id: '1',
            email: 'test@hotel.com',
            hotelName: 'Grand Hotel',
            tableCount: 20,
            hotelPhotoKey: null,
            photoUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Failed to update profile',
        }),
      });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/hotel name/i)).toBeInTheDocument();
    });

    const hotelNameInput = screen.getByLabelText(/hotel name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(hotelNameInput, { target: { value: 'Updated Hotel' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
  });

  it('handles photo file selection', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          id: '1',
          email: 'test@hotel.com',
          hotelName: 'Grand Hotel',
          tableCount: 20,
          hotelPhotoKey: null,
          photoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/hotel photo/i)).toBeInTheDocument();
    });

    const photoInput = screen.getByLabelText(/hotel photo/i) as HTMLInputElement;
    
    // Create a mock file
    const file = new File(['photo'], 'hotel.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null as any,
      result: 'data:image/jpeg;base64,mockbase64',
    };
    
    global.FileReader = jest.fn(() => mockFileReader) as any;

    fireEvent.change(photoInput, { target: { files: [file] } });

    // Trigger the onloadend callback
    if (mockFileReader.onloadend) {
      mockFileReader.onloadend();
    }

    await waitFor(() => {
      expect(screen.getByText(/click save to upload the new photo/i)).toBeInTheDocument();
    });
  });

  it('displays current photo when available', async () => {
    // Mock profile fetch with photo URL
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          id: '1',
          email: 'test@hotel.com',
          hotelName: 'Grand Hotel',
          tableCount: 20,
          hotelPhotoKey: 'photos/hotel123.jpg',
          photoUrl: 'https://example.com/photos/hotel123.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByAltText(/current hotel photo/i)).toBeInTheDocument();
    });

    const currentPhoto = screen.getByAltText(/current hotel photo/i) as HTMLImageElement;
    expect(currentPhoto.src).toBe('https://example.com/photos/hotel123.jpg');
  });

  it('disables submit button while submitting', async () => {
    // Mock profile fetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            id: '1',
            email: 'test@hotel.com',
            hotelName: 'Grand Hotel',
            tableCount: 20,
            hotelPhotoKey: null,
            photoUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      })
      .mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            profile: {
              id: '1',
              email: 'test@hotel.com',
              hotelName: 'Updated Hotel',
              tableCount: 25,
              hotelPhotoKey: null,
              photoUrl: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        }), 100))
      );

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/hotel name/i)).toBeInTheDocument();
    });

    const hotelNameInput = screen.getByLabelText(/hotel name/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(hotelNameInput, { target: { value: 'Updated Hotel' } });
    fireEvent.click(submitButton);

    // Button should show "Saving..." and be disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });
});
