/**
 * Unit Tests for Profile Management API
 * Tests profile retrieval, updates, and photo upload functionality
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */

import { generateToken } from '../lib/auth';
import { query, closePool } from '../lib/db';
import { generatePresignedDownloadUrl, getPhotosBucket } from '../lib/s3';

// Mock the database and S3 modules
jest.mock('../lib/db');
jest.mock('../lib/s3');

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedGeneratePresignedDownloadUrl = generatePresignedDownloadUrl as jest.MockedFunction<typeof generatePresignedDownloadUrl>;
const mockedGetPhotosBucket = getPhotosBucket as jest.MockedFunction<typeof getPhotosBucket>;

describe('Profile Management Unit Tests', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockEmail = 'test@hotel.com';
  const mockToken = generateToken(mockUserId, mockEmail);
  const mockAuthHeader = `Bearer ${mockToken}`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPhotosBucket.mockReturnValue('test-photos-bucket');
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  describe('Profile Retrieval (GET /api/profile)', () => {
    test('should retrieve profile successfully with photo', async () => {
      // Mock database response
      const mockHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 20,
        hotel_photo_key: 'photos/hotel-123.jpg',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [mockHotel],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Mock S3 presigned URL generation
      const mockPhotoUrl = 'https://s3.amazonaws.com/presigned-url';
      mockedGeneratePresignedDownloadUrl.mockResolvedValueOnce(mockPhotoUrl);

      // Simulate API call
      const { GET } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'authorization': mockAuthHeader,
        },
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toBeDefined();
      expect(data.profile.id).toBe(mockUserId);
      expect(data.profile.email).toBe(mockEmail);
      expect(data.profile.hotelName).toBe('Grand Hotel');
      expect(data.profile.tableCount).toBe(20);
      expect(data.profile.hotelPhotoKey).toBe('photos/hotel-123.jpg');
      expect(data.profile.photoUrl).toBe(mockPhotoUrl);
      
      // Verify database query was called correctly
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockUserId]
      );
      
      // Verify S3 presigned URL was generated
      expect(mockedGeneratePresignedDownloadUrl).toHaveBeenCalledWith(
        'test-photos-bucket',
        'photos/hotel-123.jpg'
      );
    });

    test('should retrieve profile successfully without photo', async () => {
      // Mock database response without photo
      const mockHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 20,
        hotel_photo_key: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [mockHotel],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Simulate API call
      const { GET } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'authorization': mockAuthHeader,
        },
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.photoUrl).toBeNull();
      
      // Verify S3 presigned URL was NOT generated
      expect(mockedGeneratePresignedDownloadUrl).not.toHaveBeenCalled();
    });

    test('should return 401 when not authenticated', async () => {
      const { GET } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {},
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should return 404 when profile not found', async () => {
      // Mock empty database response
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const { GET } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'authorization': mockAuthHeader,
        },
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    test('should handle S3 error gracefully and continue without photo URL', async () => {
      // Mock database response with photo
      const mockHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 20,
        hotel_photo_key: 'photos/hotel-123.jpg',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [mockHotel],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Mock S3 error
      mockedGeneratePresignedDownloadUrl.mockRejectedValueOnce(new Error('S3 error'));

      const { GET } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'authorization': mockAuthHeader,
        },
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.photoUrl).toBeNull();
    });
  });

  describe('Profile Update with Valid Data (PUT /api/profile)', () => {
    test('should update hotel name successfully', async () => {
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Updated Hotel Name',
        table_count: 20,
        hotel_photo_key: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: 'Updated Hotel Name',
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.hotelName).toBe('Updated Hotel Name');
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE hotels'),
        expect.arrayContaining(['Updated Hotel Name', mockUserId])
      );
    });

    test('should update table count successfully', async () => {
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 30,
        hotel_photo_key: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tableCount: 30,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.tableCount).toBe(30);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE hotels'),
        expect.arrayContaining([30, mockUserId])
      );
    });

    test('should update hotel photo key successfully', async () => {
      const photoKey = 'photos/new-hotel-photo.jpg';
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 20,
        hotel_photo_key: photoKey,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const mockPhotoUrl = 'https://s3.amazonaws.com/presigned-url-new';
      mockedGeneratePresignedDownloadUrl.mockResolvedValueOnce(mockPhotoUrl);

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelPhotoKey: photoKey,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.hotelPhotoKey).toBe(photoKey);
      expect(data.profile.photoUrl).toBe(mockPhotoUrl);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE hotels'),
        expect.arrayContaining([photoKey, mockUserId])
      );
    });

    test('should update multiple fields simultaneously', async () => {
      const photoKey = 'photos/updated-photo.jpg';
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'New Hotel Name',
        table_count: 25,
        hotel_photo_key: photoKey,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const mockPhotoUrl = 'https://s3.amazonaws.com/presigned-url-multi';
      mockedGeneratePresignedDownloadUrl.mockResolvedValueOnce(mockPhotoUrl);

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: 'New Hotel Name',
          tableCount: 25,
          hotelPhotoKey: photoKey,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.hotelName).toBe('New Hotel Name');
      expect(data.profile.tableCount).toBe(25);
      expect(data.profile.hotelPhotoKey).toBe(photoKey);
      expect(data.profile.photoUrl).toBe(mockPhotoUrl);
    });

    test('should trim whitespace from hotel name', async () => {
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Trimmed Hotel',
        table_count: 20,
        hotel_photo_key: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: '  Trimmed Hotel  ',
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE hotels'),
        expect.arrayContaining(['Trimmed Hotel', mockUserId])
      );
    });
  });

  describe('Profile Update with Invalid Data (PUT /api/profile)', () => {
    test('should reject empty hotel name', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: '',
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors).toBeDefined();
      expect(data.errors.some((e: any) => e.field === 'hotelName')).toBe(true);
      expect(mockedQuery).not.toHaveBeenCalled();
    });

    test('should reject whitespace-only hotel name', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: '   ',
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.some((e: any) => e.field === 'hotelName')).toBe(true);
    });

    test('should reject non-string hotel name', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: 123,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.some((e: any) => e.field === 'hotelName')).toBe(true);
    });

    test('should reject negative table count', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tableCount: -5,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.some((e: any) => e.field === 'tableCount')).toBe(true);
    });

    test('should reject zero table count', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tableCount: 0,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.some((e: any) => e.field === 'tableCount')).toBe(true);
    });

    test('should reject non-integer table count', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tableCount: 10.5,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.some((e: any) => e.field === 'tableCount')).toBe(true);
    });

    test('should reject non-number table count', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tableCount: '20',
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.some((e: any) => e.field === 'tableCount')).toBe(true);
    });

    test('should reject non-string photo key', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelPhotoKey: 12345,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.some((e: any) => e.field === 'hotelPhotoKey')).toBe(true);
    });

    test('should reject multiple invalid fields', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: '',
          tableCount: -10,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors.length).toBeGreaterThanOrEqual(2);
      expect(data.errors.some((e: any) => e.field === 'hotelName')).toBe(true);
      expect(data.errors.some((e: any) => e.field === 'tableCount')).toBe(true);
    });

    test('should return 400 when no fields to update', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No fields to update');
    });

    test('should return 401 when not authenticated', async () => {
      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelName: 'New Hotel',
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Photo Upload', () => {
    test('should accept null photo key to remove photo', async () => {
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 20,
        hotel_photo_key: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelPhotoKey: null,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.hotelPhotoKey).toBeNull();
      expect(data.profile.photoUrl).toBeNull();
      expect(mockedGeneratePresignedDownloadUrl).not.toHaveBeenCalled();
    });

    test('should handle photo upload with valid S3 key', async () => {
      const photoKey = 'photos/hotel-456.jpg';
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 20,
        hotel_photo_key: photoKey,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const mockPhotoUrl = 'https://s3.amazonaws.com/presigned-url-photo';
      mockedGeneratePresignedDownloadUrl.mockResolvedValueOnce(mockPhotoUrl);

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelPhotoKey: photoKey,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.hotelPhotoKey).toBe(photoKey);
      expect(data.profile.photoUrl).toBe(mockPhotoUrl);
      expect(mockedGeneratePresignedDownloadUrl).toHaveBeenCalledWith(
        'test-photos-bucket',
        photoKey
      );
    });

    test('should handle S3 error during photo URL generation gracefully', async () => {
      const photoKey = 'photos/hotel-789.jpg';
      const updatedHotel = {
        id: mockUserId,
        email: mockEmail,
        hotel_name: 'Grand Hotel',
        table_count: 20,
        hotel_photo_key: photoKey,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedHotel],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Mock S3 error
      mockedGeneratePresignedDownloadUrl.mockRejectedValueOnce(new Error('S3 service unavailable'));

      const { PUT } = await import('../app/api/profile/route');
      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'authorization': mockAuthHeader,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hotelPhotoKey: photoKey,
        }),
      });

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.hotelPhotoKey).toBe(photoKey);
      expect(data.profile.photoUrl).toBeNull();
    });
  });
});
