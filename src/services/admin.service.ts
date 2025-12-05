import { apiClient } from '@/lib/api';

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeEnrollments: number;
  totalRevenue?: number;
  pendingRequests?: number;
}

export const adminService = {
  async getStats() {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  async getUsers(role?: string) {
    const params = role ? { role } : {};
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  async createUser(data: any) {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },

  async updateUser(id: string, data: any) {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },

  async getDashboardData() {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  async getAnalytics(period?: string) {
    const params = period ? { period } : {};
    const response = await apiClient.get('/admin/analytics', { params });
    return response.data;
  },
};
