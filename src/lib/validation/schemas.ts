import { z } from 'zod';

// Course Schemas
export const courseCreateSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(255, 'العنوان طويل جداً'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  short_description: z.string().max(500).optional(),
  price: z.number().min(0, 'السعر يجب أن يكون موجباً'),
  discount_price: z.number().min(0).nullable().optional(),
  is_published: z.boolean().default(false),
  is_paid: z.boolean().default(true),
  category: z.string().min(1, 'يجب اختيار فئة'),
  level: z.enum(['مبتدئ', 'متوسط', 'متقدم'], {
    errorMap: () => ({ message: 'يجب اختيار مستوى صحيح' }),
  }),
  instructor_id: z.string().uuid('معرف المدرس غير صحيح').optional(),
  thumbnail: z.string().url('رابط الصورة غير صحيح').optional(),
  duration_hours: z.number().min(0).optional(),
});

export const courseUpdateSchema = courseCreateSchema.partial();

// User Schemas
export const userRegisterSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم'),
  role: z.enum(['student', 'teacher', 'admin']).default('student'),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'رقم الهاتف غير صحيح').optional(),
  fatherName: z.string().optional(),
  studentPhone: z.string().optional(),
  parentPhone: z.string().optional(),
  motherPhone: z.string().optional(),
  schoolName: z.string().optional(),
  city: z.string().optional(),
  gradeLevel: z.string().optional(),
  guardianJob: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token مطلوب'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم'),
});

// Lesson Schemas
export const lessonAccessCodeSchema = z.object({
  code: z.string().min(1, 'الكود مطلوب'),
});

export const lessonCreateSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
  video_url: z.string().url('رابط الفيديو غير صحيح').optional(),
  content: z.string().optional(),
  duration: z.number().min(0).optional(),
  order_index: z.number().int().min(0).default(0),
  is_free: z.boolean().default(false),
  requires_access_code: z.boolean().default(false),
  access_code: z.string().optional(),
  course_id: z.string().uuid('معرف الكورس غير صحيح'),
  section_id: z.string().uuid('معرف القسم غير صحيح').optional(),
});

export const lessonUpdateSchema = lessonCreateSchema.partial();

// Exam Schemas
export const examCreateSchema = z.object({
  id: z.string().optional(), // Optional for backward compatibility
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
  courseId: z.string().uuid('معرف الكورس غير صحيح'),
  course_id: z.string().uuid('معرف الكورس غير صحيح').optional(), // Support both formats
  sectionId: z.string().uuid('معرف القسم غير صحيح').optional(),
  section_id: z.string().uuid('معرف القسم غير صحيح').optional(), // Support both formats
  orderIndex: z.number().int().min(0).optional(),
  order_index: z.number().int().min(0).optional(), // Support both formats
  duration: z.number().int().min(1, 'المدة يجب أن تكون دقيقة واحدة على الأقل'),
  totalMarks: z.number().min(1, 'الدرجة الكلية يجب أن تكون 1 على الأقل').optional(),
  total_marks: z.number().min(1, 'الدرجة الكلية يجب أن تكون 1 على الأقل').optional(), // Support both
  passingMarks: z.number().min(0, 'درجة النجاح يجب أن تكون موجبة').optional(),
  passing_marks: z.number().min(0, 'درجة النجاح يجب أن تكون موجبة').optional(), // Support both
  questions: z.array(z.object({
    id: z.string(),
    question: z.string().min(1, 'السؤال مطلوب'),
    type: z.enum(['multiple_choice', 'true_false', 'essay']),
    options: z.array(z.string()).optional(),
    correct_answer: z.union([z.string(), z.number(), z.array(z.string())]),
    marks: z.number().min(0),
  })).min(1, 'يجب أن يحتوي الامتحان على سؤال واحد على الأقل'),
  startDate: z.string().datetime().optional(),
  start_date: z.string().datetime().optional(), // Support both
  endDate: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(), // Support both
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(), // Support both
}).transform((data) => ({
  // Normalize to snake_case for database
  course_id: data.course_id || data.courseId,
  section_id: data.section_id || data.sectionId,
  order_index: data.order_index ?? data.orderIndex ?? 0,
  total_marks: data.total_marks ?? data.totalMarks ?? 0,
  passing_marks: data.passing_marks ?? data.passingMarks ?? 0,
  start_date: data.start_date || data.startDate,
  end_date: data.end_date || data.endDate,
  is_active: data.is_active ?? data.isActive ?? true,
  title: data.title,
  description: data.description,
  duration: data.duration,
  questions: data.questions,
}));

// Section Schemas
export const sectionCreateSchema = z.object({
  courseId: z.string().uuid('معرف الكورس غير صحيح'),
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(255),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
  lessons: z.array(z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    video_url: z.string().url().optional(),
    duration: z.number().min(0).optional(),
    duration_minutes: z.number().min(0).optional(),
    order_index: z.number().int().min(0).optional(),
    order: z.number().int().min(0).optional(),
    is_preview: z.boolean().optional(),
  })).optional(),
});

// Course Messages Schemas
export const courseMessageCreateSchema = z.object({
  courseId: z.string().uuid('معرف الكورس غير صحيح'),
  userId: z.string().uuid('معرف المستخدم غير صحيح'),
  content: z.string().min(1, 'المحتوى مطلوب').max(5000, 'المحتوى طويل جداً'),
});

export const courseMessageGetSchema = z.object({
  courseId: z.string().uuid('معرف الكورس غير صحيح'),
  userId: z.string().uuid('معرف المستخدم غير صحيح'),
});

export const examSubmitSchema = z.object({
  examId: z.string().uuid('معرف الامتحان غير صحيح'),
  courseId: z.string().uuid('معرف الكورس غير صحيح'),
  userId: z.string().uuid('معرف المستخدم غير صحيح'),
  answers: z.record(z.any()),
  cheated: z.boolean().default(false),
});

// Payment Schemas
export const paymentRequestSchema = z.object({
  courseId: z.string().uuid('معرف الكورس غير صحيح').optional(),
  bookId: z.string().uuid('معرف الكتاب غير صحيح').optional(),
  studentName: z.string().min(2, 'اسم الطالب مطلوب'),
  studentPhone: z.string().regex(/^[0-9]{10,15}$/, 'رقم الهاتف غير صحيح'),
  studentEmail: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  courseName: z.string().optional(),
  coursePrice: z.number().min(0, 'السعر يجب أن يكون موجباً').optional(),
  teacherName: z.string().optional(),
  teacherPhone: z.string().optional(),
  price: z.number().min(0, 'السعر يجب أن يكون موجباً').optional(),
}).refine(
  (data) => data.courseId || data.bookId,
  { message: 'يجب توفير معرف الكورس أو الكتاب' }
);

// Message Schemas
export const messageCreateSchema = z.object({
  receiverId: z.string().uuid('معرف المستقبل غير صحيح'),
  receiver_id: z.string().uuid('معرف المستقبل غير صحيح').optional(), // Support both formats
  content: z.string().min(1, 'محتوى الرسالة مطلوب').max(5000, 'الرسالة طويلة جداً'),
  courseId: z.string().uuid('معرف الكورس غير صحيح').optional(),
  course_id: z.string().uuid('معرف الكورس غير صحيح').optional(), // Support both formats
  messageType: z.enum(['text', 'file', 'image']).default('text').optional(),
  fileUrl: z.string().url().optional(),
}).transform((data) => ({
  receiver_id: data.receiver_id || data.receiverId,
  course_id: data.course_id || data.courseId,
  content: data.content,
  message_type: data.messageType || 'text',
  file_url: data.fileUrl,
}));

// Enrollment Schemas
export const enrollmentCreateSchema = z.object({
  course_id: z.string().uuid('معرف الكورس غير صحيح'),
  student_id: z.string().uuid('معرف الطالب غير صحيح'),
});

// UUID Validation Helper
export const uuidSchema = z.string().uuid('معرف غير صحيح');

// Common Pagination Schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Course Access Code Schemas
export const courseAccessCodeRedeemSchema = z.object({
  courseId: z.string().uuid('معرف الكورس غير صحيح'),
  studentId: z.string().uuid('معرف الطالب غير صحيح').optional(),
  studentPhone: z.string().regex(/^[0-9]{10,15}$/,'رقم الهاتف غير صحيح').optional(),
  code: z.string().min(1, 'الكود مطلوب'),
});

