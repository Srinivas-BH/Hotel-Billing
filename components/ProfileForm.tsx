'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { handleApiError } from '@/lib/client-error-handling';

const profileSchema = z.object({
  hotelName: z.string().min(1, 'Hotel name is required'),
  tableCount: z.number().int().positive('Table count must be a positive number'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileData {
  id: string;
  email: string;
  hotelName: string;
  tableCount: number;
  hotelPhotoKey: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ProfileForm() {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>('');
  const { showError, showSuccess } = useToast();
  const { token, user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        const profile: ProfileData = data.profile;

        // Set form values
        reset({
          hotelName: profile.hotelName,
          tableCount: profile.tableCount,
        });

        // Set current photo URL
        if (profile.photoUrl) {
          setCurrentPhotoUrl(profile.photoUrl);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhotoToS3 = async (file: File): Promise<string> => {
    // Get presigned URL for upload
    const presignedResponse = await fetch('/api/s3/presigned-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder: 'hotel-photos',
      }),
    });

    if (!presignedResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, fileKey } = await presignedResponse.json();

    // Upload file to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload photo');
    }

    return fileKey;
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let photoKey: string | null | undefined = undefined;

      // Upload photo if a new one is provided
      if (photoFile) {
        photoKey = await uploadPhotoToS3(photoFile);
      }

      // Update profile
      const updateData: any = {
        hotelName: data.hotelName,
        tableCount: data.tableCount,
      };

      if (photoKey !== undefined) {
        updateData.hotelPhotoKey = photoKey;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Failed to update profile. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
        return;
      }

      // Update current photo URL if new photo was uploaded
      if (result.profile.photoUrl) {
        setCurrentPhotoUrl(result.profile.photoUrl);
      }

      // Clear photo preview
      setPhotoPreview('');
      setPhotoFile(null);

      setSuccess('Profile updated successfully!');
      showSuccess('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      const errorMessage = await handleApiError(err, 'An error occurred. Please try again.');
      setError(errorMessage);
      showError(errorMessage);
      console.error('Profile update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={user?.email || ''}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
      </div>

      <div>
        <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">
          Hotel Name
        </label>
        <input
          {...register('hotelName')}
          type="text"
          id="hotelName"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Grand Hotel"
        />
        {errors.hotelName && (
          <p className="mt-1 text-sm text-red-600">{errors.hotelName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="tableCount" className="block text-sm font-medium text-gray-700">
          Number of Tables
        </label>
        <input
          {...register('tableCount', { valueAsNumber: true })}
          type="number"
          id="tableCount"
          min="1"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="10"
        />
        {errors.tableCount && (
          <p className="mt-1 text-sm text-red-600">{errors.tableCount.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
          Hotel Photo
        </label>
        
        {/* Current photo */}
        {currentPhotoUrl && !photoPreview && (
          <div className="mt-2 mb-3">
            <p className="text-xs text-gray-500 mb-2">Current photo:</p>
            <div className="relative h-32 w-32 rounded-lg overflow-hidden">
              <Image
                src={currentPhotoUrl}
                alt="Current hotel photo"
                fill
                sizes="128px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* New photo preview */}
        {photoPreview && (
          <div className="mt-2 mb-3">
            <p className="text-xs text-gray-500 mb-2">New photo preview:</p>
            <div className="relative h-32 w-32 rounded-lg overflow-hidden">
              <Image
                src={photoPreview}
                alt="New hotel photo preview"
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        <input
          type="file"
          id="photo"
          accept="image/*"
          onChange={handlePhotoChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          {photoFile ? 'Click Save to upload the new photo' : 'Upload a new photo to replace the current one'}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px] font-medium"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
