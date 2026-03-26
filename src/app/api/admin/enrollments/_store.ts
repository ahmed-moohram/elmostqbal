export type Enrollment = {
  _id: string;
  studentId: string;
  studentInfo?: {
    name: string;
    phone?: string;
    email?: string;
    avatar?: string;
  };
  courseId: string;
  course?: { _id: string; title: string };
  status: 'pending' | 'approved' | 'rejected';
  paymentInfo?: { status?: string };
  submittedAt?: string;
  createdAt?: string;
};

let enrollments: Enrollment[] = [
  {
    _id: 'req-1',
    studentId: 'stu-1',
    studentInfo: { name: 'طالب 1', phone: '01000000001', email: 's1@example.com' },
    courseId: '1',
    course: { _id: '1', title: 'رياضيات' },
    status: 'pending',
    paymentInfo: { status: 'pending' },
    submittedAt: new Date().toISOString(),
  },
  {
    _id: 'req-2',
    studentId: 'stu-2',
    studentInfo: { name: 'طالب 2', phone: '01000000002', email: 's2@example.com' },
    courseId: '2',
    course: { _id: '2', title: 'فيزياء' },
    status: 'approved',
    paymentInfo: { status: 'completed' },
    submittedAt: new Date().toISOString(),
  },
];

export function listEnrollments() {
  return enrollments;
}

export function approveEnrollment(id: string) {
  const idx = enrollments.findIndex((e) => e._id === id);
  if (idx === -1) return false;
  enrollments[idx] = { ...enrollments[idx], status: 'approved', paymentInfo: { status: 'completed' } };
  return true;
}

export function rejectEnrollment(id: string) {
  const idx = enrollments.findIndex((e) => e._id === id);
  if (idx === -1) return false;
  enrollments[idx] = { ...enrollments[idx], status: 'rejected', paymentInfo: { status: 'failed' } };
  return true;
}