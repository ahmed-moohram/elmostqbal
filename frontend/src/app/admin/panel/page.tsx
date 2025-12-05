"use client";

import AdminLayout from '@/components/AdminLayout';

interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  grade_levels: string[];
  subjects: string[];
  experience_years: number;
  qualifications: string;
  bio: string;
  profile_image?: string;
  applied_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// المواد الدراسية حسب المرحلة
const SUBJECTS_BY_GRADE = {
  'primary': [
    'اللغة العربية',
    'الرياضيات', 
    'العلوم',
    'الدراسات الاجتماعية',
    'اللغة الإنجليزية',
    'التربية الدينية',
    'التربية الفنية'
  ],
  'preparatory': [
    'اللغة العربية',
    'الرياضيات',
    'العلوم',
    'الدراسات الاجتماعية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية/الألمانية',
    'التربية الدينية',
    'الحاسب الآلي'
  ],
  'secondary': [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية/الألمانية',
    'الرياضيات البحتة',
    'الرياضيات التطبيقية',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'الجيولوجيا',
    'التاريخ',
    'الجغرافيا',
    'الفلسفة والمنطق',
    'علم النفس والاجتماع',
    'التربية الوطنية'
  ]
};

export default function AdminPanel() {
  return (
    <AdminLayout>
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">هذه الصفحة غير متاحة حالياً</h1>
          <p className="text-gray-600 dark:text-gray-300">
            سيتم تفعيل لوحة مراجعة واعتماد المدرسين بعد الانتهاء من نظام التقديم الحقيقي.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
