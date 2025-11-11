import { apiClient } from '@/lib/api';

export interface Student {
  _id: string;
  name: string;
  email?: string;
  studentPhone: string;
  parentPhone: string;
  gradeLevel?: string;
  city?: string;
  enrollments: any[];
  progress: number;
  role: 'student';
  createdAt: Date;
  updatedAt: Date;
}

export const studentsService = {
  async getAll() {
    const response = await apiClient.get('/students');
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  async getProgress(id: string) {
    const response = await apiClient.get(`/students/${id}/progress`);
    return response.data;
  },

  async update(id: string, data: Partial<Student>) {
    const response = await apiClient.put(`/students/${id}`, data);
    return response.data;
  },

  async getEnrollments(studentId: string) {
    const response = await apiClient.get(`/students/${studentId}/enrollments`);
    return response.data;
  },

  async getCourses(studentId: string) {
    const response = await apiClient.get(`/students/${studentId}/courses`);
    return response.data;
  },
};
