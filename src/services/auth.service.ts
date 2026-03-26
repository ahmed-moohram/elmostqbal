import { apiClient } from '@/lib/api';

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    studentPhone?: string;
    role: 'admin' | 'teacher' | 'student';
    image?: string;
  };
}

export interface RegisterData {
  name: string;
  fatherName: string;
  studentPhone: string;
  parentPhone: string;
  motherPhone?: string;
  password: string;
  email?: string;
  gradeLevel?: string;
  city?: string;
  schoolName?: string;
  guardianJob?: string;
}

export const authService = {
  async login(studentPhone: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', { studentPhone, password });
    return response.data;
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: any) {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};
