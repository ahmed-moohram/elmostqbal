import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// إضافة Token تلقائياً لكل طلب
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// معالجة الأخطاء
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - توجيه للـ login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Services

export const authAPI = {
  login: async (studentPhone: string, password: string) => {
    const response = await apiClient.post('/auth/login', { studentPhone, password });
    return response.data;
  },

  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

export const coursesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  getContent: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}/content`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/courses', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
  },
};

export const enrollmentAPI = {
  create: async (data: {
    courseId: string;
    paymentInfo: {
      method: string;
      amount: number;
      receiptImage: string;
      phoneNumber?: string;
    };
  }) => {
    const response = await apiClient.post('/admin/enrollment-requests', data);
    return response.data;
  },

  getAll: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/admin/enrollment-requests', { params });
    return response.data;
  },

  approve: async (requestId: string) => {
    const response = await apiClient.post(`/admin/enrollment-requests/${requestId}/approve`);
    return response.data;
  },

  reject: async (requestId: string, reason: string) => {
    const response = await apiClient.post(`/admin/enrollment-requests/${requestId}/reject`, {
      rejectionReason: reason,
    });
    return response.data;
  },
};

export const teachersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/teachers');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/teachers/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/teachers', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/teachers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/teachers/${id}`);
    return response.data;
  },
};

export const studentsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/students');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  getProgress: async (id: string) => {
    const response = await apiClient.get(`/students/${id}/progress`);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/students/${id}`, data);
    return response.data;
  },
};

export const adminAPI = {
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },
};
