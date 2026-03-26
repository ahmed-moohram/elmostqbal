import { apiClient } from '@/lib/api';

export interface Teacher {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  avatar?: string;
  courses: number;
  students: number;
  rating: number;
  role: 'teacher';
  createdAt: Date;
  updatedAt: Date;
}

export const teachersService = {
  async getAll() {
    const response = await apiClient.get('/teachers');
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/teachers/${id}`);
    return response.data;
  },

  async create(data: Partial<Teacher>) {
    const response = await apiClient.post('/teachers', data);
    return response.data;
  },

  async update(id: string, data: Partial<Teacher>) {
    const response = await apiClient.put(`/teachers/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/teachers/${id}`);
    return response.data;
  },

  async getCourses(teacherId: string) {
    const response = await apiClient.get(`/teachers/${teacherId}/courses`);
    return response.data;
  },

  async getStudents(teacherId: string) {
    const response = await apiClient.get(`/teachers/${teacherId}/students`);
    return response.data;
  },
};
