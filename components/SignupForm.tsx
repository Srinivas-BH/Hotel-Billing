'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Upload, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { handleApiError } from '@/lib/client-error-handling';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  hotelName: z.string().min(1, 'Hotel name is required'),
  tableCount: z.number().int().positive('Table count must be a positive number'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { login } = useAuth();
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

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
    try {
      // Get presigned URL for upload
      const presignedResponse = await fetch('/api/s3/presigned-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: 'photos',
        }),
      });

      if (!presignedResponse.ok) {
        console.warn('Failed to get presigned URL, skipping photo upload');
        return '';
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
        console.warn('Failed to upload photo to S3, skipping');
        return '';
      }

      return fileKey;
    } catch (error) {
      console.warn('Photo upload error, continuing without photo:', error);
      return '';
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setError('');
    setUploadProgress('');

    try {
      let photoKey: string | null = null;

      // Upload photo if provided (skip if S3 not configured)
      if (photoFile) {
        setUploadProgress('Uploading photo...');
        try {
          photoKey = await uploadPhotoToS3(photoFile);
          if (photoKey) {
            setUploadProgress('Photo uploaded successfully!');
          } else {
            setUploadProgress('Photo upload skipped (S3 not configured)');
          }
        } catch (uploadError) {
          console.warn('Photo upload failed, continuing without photo:', uploadError);
          setUploadProgress('Continuing without photo...');
        }
      }

      // Create account
      setUploadProgress('Creating your account...');
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          hotelPhotoKey: photoKey || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Signup failed. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
        return;
      }

      // Store token and user data
      login(result.token, result.user);

      // Show success message
      showSuccess('Account created successfully! Redirecting...');

      // Redirect to dashboard
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err) {
      const errorMessage = await handleApiError(err, 'An error occurred. Please try again.');
      setError(errorMessage);
      showError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="transform transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400"
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="mt-1.5 text-sm text-red-600 animate-fade-in">{errors.email.message}</p>
        )}
      </div>

      <div className="transform transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-sm text-red-600 animate-fade-in">{errors.password.message}</p>
        )}
      </div>

      <div className="transform transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700 mb-1">
          Hotel Name
        </label>
        <input
          {...register('hotelName')}
          type="text"
          id="hotelName"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400"
          placeholder="Grand Hotel"
        />
        {errors.hotelName && (
          <p className="mt-1.5 text-sm text-red-600 animate-fade-in">{errors.hotelName.message}</p>
        )}
      </div>

      <div className="transform transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="tableCount" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Tables
        </label>
        <input
          {...register('tableCount', { valueAsNumber: true })}
          type="number"
          id="tableCount"
          min="1"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400"
          placeholder="10"
        />
        {errors.tableCount && (
          <p className="mt-1.5 text-sm text-red-600 animate-fade-in">{errors.tableCount.message}</p>
        )}
      </div>

      <div className="transform transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
          Hotel Photo <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <div className="mt-1 flex items-center gap-4">
          <label
            htmlFor="photo"
            className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            <Upload size={20} />
            <span>Choose Photo</span>
          </label>
          <input
            type="file"
            id="photo"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          {photoFile && (
            <span className="text-sm text-gray-600 animate-fade-in">{photoFile.name}</span>
          )}
        </div>
        {photoPreview && (
          <div className="mt-3 animate-fade-in">
            <div className="relative h-32 w-32 rounded-lg overflow-hidden shadow-md ring-2 ring-blue-500 ring-opacity-50">
              <Image
                src={photoPreview}
                alt="Hotel preview"
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}
      </div>

      {uploadProgress && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 animate-fade-in">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {uploadProgress}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fade-in">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none min-h-[44px] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            Creating account...
          </span>
        ) : (
          'Create account'
        )}
      </button>
    </form>
  );
}
