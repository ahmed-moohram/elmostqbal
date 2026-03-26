import { apiClient } from '@/lib/api';

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  isPublished: boolean;
  isPaid: boolean;
  category: string;
  level: string;
  thumbnail?: string;
  teacherId: string;
  teacherName: string;
  enrolledStudents: number;
  sections: any[];
  createdAt: string;
  updatedAt: string;
}

export const coursesService = {
  async getAll() {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  async getContent(id: string) {
    const response = await apiClient.get(`/courses/${id}/content`);
    return response.data;
  },

  async create(data: Partial<Course>) {
    const response = await apiClient.post('/courses', data);
    return response.data;
  },

  async update(id: string, data: Partial<Course>) {
    const response = await apiClient.put(`/courses/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
  },

  async enroll(courseId: string) {
    const response = await apiClient.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  async getMyCourses() {
    const response = await apiClient.get('/courses/my-courses');
    return response.data;
  },
};
