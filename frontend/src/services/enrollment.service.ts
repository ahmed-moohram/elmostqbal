import { apiClient } from '@/lib/api';

export interface EnrollmentRequest {
  _id: string;
  studentId: string;
  courseId: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentInfo: {
    method: string;
    amount: number;
    receiptImage: string;
    phoneNumber?: string;
    transactionId?: string;
  };
  studentInfo: {
    name: string;
    email: string;
    phone: string;
    parentPhone: string;
  };
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  approvalMessage?: string;
  rejectionReason?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const enrollmentService = {
  async create(data: {
    courseId: string;
    paymentInfo: {
      method: string;
      amount: number;
      receiptImage: string;
      phoneNumber?: string;
    };
  }) {
    const response = await apiClient.post('/admin/enrollment-requests', data);
    return response.data;
  },

  async getAll(status?: string) {
    const params = status ? { status } : {};
    const response = await apiClient.get('/admin/enrollment-requests', { params });
    return response.data;
  },

  async approve(requestId: string, message?: string) {
    const response = await apiClient.post(`/admin/enrollment-requests/${requestId}/approve`, {
      approvalMessage: message,
    });
    return response.data;
  },

  async reject(requestId: string, reason: string) {
    const response = await apiClient.post(`/admin/enrollment-requests/${requestId}/reject`, {
      rejectionReason: reason,
    });
    return response.data;
  },

  async getById(requestId: string) {
    const response = await apiClient.get(`/admin/enrollment-requests/${requestId}`);
    return response.data;
  },
};
