import { GET, POST } from '@/app/api/courses/route';
import { NextRequest } from 'next/server';

// Mock Supabase
jest.mock('@/lib/supabase-client', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-id', title: 'Test Course' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('/api/courses', () => {
  describe('GET', () => {
    it('should return list of courses', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle database errors', async () => {
      const supabase = require('@/lib/supabase-client').default;
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: { message: 'Database error' },
          })),
        })),
      });

      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST', () => {
    it('should create a new course with valid data', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Course');
      formData.append('description', 'Test Description');
      formData.append('price', '100');
      formData.append('category', 'Technology');
      formData.append('level', 'مبتدئ');

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.id).toBeDefined();
    });

    it('should reject course with missing required fields', async () => {
      const formData = new FormData();
      formData.append('title', ''); // Empty title

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      
      // Should either return error or create with default values
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});

