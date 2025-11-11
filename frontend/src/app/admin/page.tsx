'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import { 
  FaChartBar, FaGraduationCap, FaChalkboardTeacher, FaBook, 
  FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaTimes, FaCheck,
  FaUpload, FaUserGraduate, FaMoneyBillWave, FaThList, FaThLarge,
  FaChartLine, FaUsers
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Componentes simples - تم إزالة المكونات الثقيلة
import SimpleStats from '@/components/admin/SimpleStats';

// Clase de almacenamiento para el token
const userStorage = {
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  }
};

// Interfaces
interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPrice: number | null;
  isPublished: boolean;
  isPaid: boolean;
  category: string;
  level: string;
  thumbnail: string;
  enrolledStudents: number;
  createdAt: string;
}

interface NewCourse {
  title: string;
  description: string;
  price: number;
  discountPrice: number | null;
  isPublished: boolean;
  isPaid: boolean;
  category: string;
  level: string;
  thumbnail: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  courses: number;
  students: number;
  rating: number;
  specialization: string;
  joinDate: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  enrolledCourses: number;
  joinDate: string;
}

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue?: number;
  activeEnrollments?: number;
  monthlyRevenue?: number;
  conversionRate?: number;
}

interface LoadingState {
  courses: boolean;
  teachers: boolean;
  students: boolean;
  stats: boolean;
}

interface EnrollmentRequest {
  id: string;
  studentName: string;
  studentPhone: string;
  studentGrade: string;
  courseName: string;
  coursePrice: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  paymentProof?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para las vistas y filtros
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  
  // Estados para los datos
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    totalStudents: 0, 
    totalTeachers: 0, 
    totalCourses: 0, 
    totalRevenue: 0 
  });
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  
  // Estados para modales y carga
  const [loading, setLoading] = useState<LoadingState>({
    courses: false,
    teachers: false,
    students: false,
    stats: false
  });
  const [error, setError] = useState<string>('');
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState<boolean>(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState<boolean>(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: '',
    subject: '',
    grade: '',
    bio: '',
    phone: '',
    specialization: ''
  });
  
  // Nuevo curso
  const [newCourse, setNewCourse] = useState<NewCourse>({
    title: '',
    description: '',
    price: 0,
    discountPrice: null,
    isPublished: false,
    isPaid: true,
    category: '',
    level: 'مبتدئ',
    thumbnail: ''
  });
  
  // تحميل طلبات الاشتراك من localStorage
  useEffect(() => {
    const loadEnrollmentRequests = () => {
      const requestsStr = localStorage.getItem('enrollmentRequests');
      if (requestsStr) {
        try {
          const requests = JSON.parse(requestsStr);
          setEnrollmentRequests(requests);
        } catch (e) {
          console.error('Error loading enrollment requests:', e);
        }
      }
    };
    
    loadEnrollmentRequests();
    
    // تحديث كل 10 ثواني للتحقق من طلبات جديدة
    const interval = setInterval(loadEnrollmentRequests, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // الموافقة على طلب اشتراك
  const approveEnrollment = (requestId: string, courseId: string, studentPhone: string) => {
    // تحديث حالة الطلب
    const updatedRequests = enrollmentRequests.map(req => 
      req.id === requestId ? { ...req, status: 'approved' as const } : req
    );
    setEnrollmentRequests(updatedRequests);
    localStorage.setItem('enrollmentRequests', JSON.stringify(updatedRequests));
    
    // تسجيل الاشتراك
    const enrolledCoursesStr = localStorage.getItem(`student_${studentPhone}_courses`);
    let enrolledCourses: string[] = [];
    if (enrolledCoursesStr) {
      try {
        enrolledCourses = JSON.parse(enrolledCoursesStr);
      } catch (e) {
        console.error('Error parsing enrolled courses:', e);
      }
    }
    
    if (!enrolledCourses.includes(courseId)) {
      enrolledCourses.push(courseId);
      localStorage.setItem(`student_${studentPhone}_courses`, JSON.stringify(enrolledCourses));
    }
    
    toast.success('تم الموافقة على الاشتراك بنجاح! ✅');
  };
  
  // رفض طلب اشتراك
  const rejectEnrollment = (requestId: string) => {
    const updatedRequests = enrollmentRequests.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
    );
    setEnrollmentRequests(updatedRequests);
    localStorage.setItem('enrollmentRequests', JSON.stringify(updatedRequests));
    
    toast.success('تم رفض الطلب');
  };
  
  // إضافة مدرس جديد
  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.password || !newTeacher.subject || !newTeacher.grade) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    const teacher = {
      id: 'teacher-' + Date.now(),
      ...newTeacher,
      username: newTeacher.name.toLowerCase().replace(/\s+/g, ''),
      role: 'teacher',
      courses: 0,
      students: 0,
      rating: 0,
      joinDate: new Date().toISOString(),
      avatar: '/placeholder-avatar.png'
    };
    
    // حفظ المدرس
    const teachersStr = localStorage.getItem('teachers');
    let teachersList: Teacher[] = [];
    if (teachersStr) {
      try {
        teachersList = JSON.parse(teachersStr);
      } catch (e) {
        console.error('Error parsing teachers:', e);
      }
    }
    
    teachersList.push(teacher);
    localStorage.setItem('teachers', JSON.stringify(teachersList));
    
    // تحديث القائمة
    setTeachers(teachersList);
    
    // إغلاق المودال وإعادة تعيين
    setShowAddTeacherModal(false);
    setNewTeacher({
      name: '',
      email: '',
      password: '',
      subject: '',
      grade: '',
      bio: '',
      phone: '',
      specialization: ''
    });
    
    toast.success('تم إضافة المدرس بنجاح! ✅');
  };
  
  // تحميل المدرسين
  useEffect(() => {
    const teachersStr = localStorage.getItem('teachers');
    if (teachersStr) {
      try {
        const teachersList = JSON.parse(teachersStr);
        setTeachers(teachersList);
      } catch (e) {
        console.error('Error loading teachers:', e);
      }
    }
  }, []);
  
  // Arrays para selects en formularios
  const availableCategories = [
    'تطوير الويب',
    'تطوير التطبيقات',
    'الذكاء الاصطناعي',
    'علوم البيانات',
    'التسويق الرقمي',
    'التصميم',
    'الأعمال',
    'اللغات',
    'أخرى'
  ];
  
  const availableLevels = [
    'مبتدئ',
    'متوسط',
    'متقدم'
  ];
  
  // Manejar cambio de imagen de miniatura
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnail(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setThumbnailPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Fetch de cursos
  const fetchCourses = async () => {
    setLoading(prev => ({ ...prev, courses: true }));
    try {
      const token = userStorage.getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error fetching courses');
      }
      
      const data = await response.json();
      // التأكد من أن البيانات array
      const coursesArray = Array.isArray(data) ? data : (data.courses || []);
      setCourses(coursesArray);
      setFilteredCourses(coursesArray);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Error al cargar los cursos. Por favor, intente de nuevo.');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };
  
  // Fetch de profesores
  const fetchTeachers = async () => {
    setLoading(prev => ({ ...prev, teachers: true }));
    try {
      const token = userStorage.getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/teachers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error fetching teachers');
      }
      
      const data = await response.json();
      // التأكد من أن البيانات array
      const teachersArray = Array.isArray(data) ? data : (data.teachers || []);
      setTeachers(teachersArray);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Error al cargar los profesores. Por favor, intente de nuevo.');
    } finally {
      setLoading(prev => ({ ...prev, teachers: false }));
    }
  };
  
  // Fetch de estudiantes
  const fetchStudents = async () => {
    setLoading(prev => ({ ...prev, students: true }));
    try {
      const token = userStorage.getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error fetching students');
      }
      
      const data = await response.json();
      // التأكد من أن البيانات array
      const studentsArray = Array.isArray(data) ? data : (data.students || []);
      setStudents(studentsArray);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Error al cargar los estudiantes. Por favor, intente de nuevo.');
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  };
  
  // Fetch de estadísticas
  const fetchStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      // استخدام Supabase لجلب الإحصائيات
      const { createClient } = await import('@supabase/supabase-js');
      const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      // جلب الإحصائيات
      const [
        { count: studentsCount },
        { count: teachersCount },
        { count: coursesCount },
        { count: enrollmentsCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true })
      ]);
      
      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalCourses: coursesCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        monthlyRevenue: 15000, // قيمة تجريبية
        conversionRate: 65 // قيمة تجريبية
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('خطأ في تحميل الإحصائيات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };
  
  // تحميل البيانات عند تغيير النافذة النشطة فقط
  useEffect(() => {
    const token = userStorage.getToken();
    if (!token) return;
    
    // تحميل الإحصائيات فقط في dashboard
    if (activeView === 'dashboard' && stats.totalStudents === 0) {
      fetchStats();
    }
    
    // تحميل الدورات فقط عند فتح صفحة الدورات
    if (activeView === 'courses' && courses.length === 0) {
      fetchCourses();
    }
    
    // تحميل المدرسين فقط عند فتح صفحة المدرسين
    if (activeView === 'teachers' && teachers.length === 0) {
      fetchTeachers();
    }
    
    // تحميل الطلاب فقط عند فتح صفحة الطلاب
    if (activeView === 'students' && students.length === 0) {
      fetchStudents();
    }
  }, [activeView]);
  
  // Abrir modal para editar curso
  const openEditModal = (course: Course) => {
    setCurrentCourse(course);
    setThumbnailPreview(course.thumbnail);
    setShowEditCourseModal(true);
  };
  
  // Añadir curso
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, courses: true }));
    
    try {
      const token = userStorage.getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const formData = new FormData();
      
      // Añadir datos del curso al FormData
      formData.append('title', newCourse.title);
      formData.append('description', newCourse.description);
      formData.append('price', newCourse.price.toString());
      if (newCourse.discountPrice !== null) {
        formData.append('discountPrice', newCourse.discountPrice.toString());
      }
      formData.append('isPublished', newCourse.isPublished.toString());
      formData.append('isPaid', newCourse.isPaid.toString());
      formData.append('category', newCourse.category);
      formData.append('level', newCourse.level);
      
      // Añadir imagen si existe
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }
      
      const response = await fetch(`${API_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error adding course');
      }
      
      // Recargar cursos y cerrar modal
      await fetchCourses();
      setShowAddCourseModal(false);
      
      // Resetear formulario
      setNewCourse({
        title: '',
        description: '',
        price: 0,
        discountPrice: null,
        isPublished: false,
        isPaid: true,
        category: '',
        level: 'مبتدئ',
        thumbnail: ''
      });
      setThumbnail(null);
      setThumbnailPreview('');
      
    } catch (err) {
      console.error('Error adding course:', err);
      setError('Error al añadir el curso. Por favor, intente de nuevo.');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };
  
  // Editar curso
  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCourse) return;
    
    setLoading(prev => ({ ...prev, courses: true }));
    
    try {
      const token = userStorage.getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const formData = new FormData();
      
      // Añadir datos del curso al FormData
      formData.append('title', currentCourse.title);
      formData.append('description', currentCourse.description);
      formData.append('price', currentCourse.price.toString());
      if (currentCourse.discountPrice !== null) {
        formData.append('discountPrice', currentCourse.discountPrice.toString());
      }
      formData.append('isPublished', currentCourse.isPublished.toString());
      formData.append('isPaid', currentCourse.isPaid.toString());
      formData.append('category', currentCourse.category);
      formData.append('level', currentCourse.level);
      
      // Añadir imagen nueva si existe
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }
      
      const response = await fetch(`${API_URL}/api/courses/${currentCourse.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error updating course');
      }
      
      // Recargar cursos y cerrar modal
      await fetchCourses();
      setShowEditCourseModal(false);
      setCurrentCourse(null);
      setThumbnail(null);
      setThumbnailPreview('');
      
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Error al actualizar el curso. Por favor, intente de nuevo.');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };
  
  // Eliminar curso
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este curso?')) return;
    
    setLoading(prev => ({ ...prev, courses: true }));
    
    try {
      const token = userStorage.getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error deleting course');
      }
      
      // Recargar cursos
      await fetchCourses();
      
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Error al eliminar el curso. Por favor, intente de nuevo.');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };
  
  // Efecto para filtrar cursos
  useEffect(() => {
    if (!Array.isArray(courses) || courses.length === 0) return;
    
    const filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
    
    setFilteredCourses(filtered);
  }, [courses, searchTerm, categoryFilter, levelFilter]);
  
  // Efecto para redireccionar si no hay token o no es admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [router]);
  
  // التحقق من أن المستخدم أدمن
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
          toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
          router.replace('/');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.replace('/login');
      }
    }
  }, [router]);
  
  return (
    <AdminLayout>
      {/* Barra superior de navegación */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-6 py-4 flex items-center ${
              activeView === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaChartBar className="mr-2" />
            لوحة التحكم
          </button>
          <button
            onClick={() => setActiveView('courses')}
            className={`px-6 py-4 flex items-center ${
              activeView === 'courses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaBook className="mr-2" />
            الدورات
          </button>
          <button
            onClick={() => setActiveView('teachers')}
            className={`px-6 py-4 flex items-center ${
              activeView === 'teachers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaChalkboardTeacher className="mr-2" />
            المعلمون
          </button>
          <button
            onClick={() => setActiveView('students')}
            className={`px-6 py-4 flex items-center ${
              activeView === 'students' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaGraduationCap className="mr-2" />
            الطلاب
          </button>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-grow">{error}</div>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
              <FaTimes />
            </button>
          </div>
        </div>
      )}
      {/* Dashboard - إحصائيات بسيطة */}
      {activeView === 'dashboard' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* الإحصائيات الأساسية فقط */}
          <SimpleStats stats={stats} />
          
          {/* طلبات الاشتراك الجديدة */}
          {enrollmentRequests.filter(req => req.status === 'pending').length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">طلبات الاشتراك الجديدة</h2>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {enrollmentRequests.filter(req => req.status === 'pending').length}
                </span>
              </div>
              
              <div className="space-y-4">
                {enrollmentRequests.filter(req => req.status === 'pending').map(request => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{request.studentName}</h3>
                        <div className="text-sm text-gray-600 space-y-1 mt-2">
                          <p><strong>رقم الهاتف:</strong> {request.studentPhone}</p>
                          <p><strong>الصف الدراسي:</strong> {request.studentGrade}</p>
                          <p><strong>الكورس:</strong> {request.courseName}</p>
                          <p><strong>السعر:</strong> <span className="text-green-600 font-bold">{request.coursePrice} ج.م</span></p>
                          <p><strong>التاريخ:</strong> {new Date(request.date).toLocaleDateString('ar-EG', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveEnrollment(request.id, request.courseName, request.studentPhone)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <FaCheck /> قبول
                        </button>
                        <button
                          onClick={() => rejectEnrollment(request.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <FaTimes /> رفض
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* رسالة ترحيبية */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">مرحباً في لوحة التحكم</h2>
            <p className="text-gray-600">
              استخدم القائمة العلوية للتنقل بين الأقسام المختلفة
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Cursos */}
      {activeView === 'courses' && (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">إدارة الدورات</h2>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 w-full md:w-auto">
                <div className="relative mr-0 md:mr-4 mb-2 md:mb-0 w-full md:w-64">
                  <input
                    type="text"
                    placeholder="البحث عن دورة..."
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
                
                <div className="flex mr-0 md:mr-4 space-x-2 w-full md:w-auto">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                  >
                    <option value="all">جميع الفئات</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                  >
                    <option value="all">جميع المستويات</option>
                    {availableLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-2 ml-0 md:ml-4">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <FaThLarge />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <FaThList />
                  </button>
                  <button 
                    onClick={() => setShowAddCourseModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    إضافة دورة
                  </button>
                </div>
              </div>
            </div>
            
            {loading.courses ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="w-full h-40 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-40">
                        {course.thumbnail ? (
                          <Image 
                            src={course.thumbnail} 
                            alt={course.title} 
                            width={400} 
                            height={200} 
                            className="object-cover w-full h-full" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <FaBook className="text-gray-400" size={30} />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {course.isPublished ? (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">منشور</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">مسودة</span>
                          )}
                          {course.isPaid ? (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">مدفوع</span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">مجاني</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded ${
                              course.level === 'مبتدئ' ? 'bg-green-100 text-green-800' :
                              course.level === 'متوسط' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {course.level}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {course.enrolledStudents} طالب
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openEditModal(course)}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="تعديل"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="حذف"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-right">العنوان</th>
                        <th className="py-3 px-6 text-right">الفئة</th>
                        <th className="py-3 px-6 text-right">المستوى</th>
                        <th className="py-3 px-6 text-right">السعر</th>
                        <th className="py-3 px-6 text-right">الطلاب</th>
                        <th className="py-3 px-6 text-right">الحالة</th>
                        <th className="py-3 px-6 text-right">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6 text-right">
                            <div className="flex items-center justify-end">
                              <div className="ml-3">
                                <div className="font-medium">{course.title}</div>
                              </div>
                              {course.thumbnail && (
                                <div className="w-8 h-8 rounded overflow-hidden bg-gray-200">
                                  <Image 
                                    src={course.thumbnail} 
                                    alt={course.title} 
                                    width={32} 
                                    height={32} 
                                    className="object-cover" 
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-6 text-right">{course.category}</td>
                          <td className="py-3 px-6 text-right">
                            <span className={`px-2 py-1 text-xs rounded ${
                              course.level === 'مبتدئ' ? 'bg-green-100 text-green-800' :
                              course.level === 'متوسط' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {course.level}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right">
                            {course.discountPrice ? (
                              <div>
                                <span className="line-through text-gray-400">${course.price}</span>
                                <span className="font-medium ml-1">${course.discountPrice}</span>
                              </div>
                            ) : (
                              <span>${course.price}</span>
                            )}
                          </td>
                          <td className="py-3 px-6 text-right">{course.enrolledStudents}</td>
                          <td className="py-3 px-6 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {course.isPublished ? (
                                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">منشور</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">مسودة</span>
                              )}
                              {course.isPaid ? (
                                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">مدفوع</span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">مجاني</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <div className="flex item-center justify-end">
                              <button
                                onClick={() => openEditModal(course)}
                                className="transform hover:text-blue-500 hover:scale-110 transition-all duration-150 mr-2"
                                title="تعديل"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="transform hover:text-red-500 hover:scale-110 transition-all duration-150"
                                title="حذف"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <FaBook className="mx-auto text-gray-300 text-5xl mb-4" />
                <p className="text-gray-500 text-lg">لا توجد دورات تطابق معايير البحث</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Profesores */}
      {activeView === 'teachers' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">إدارة المعلمين</h2>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 w-full md:w-auto">
              <div className="relative mr-0 md:mr-4 mb-2 md:mb-0 w-full md:w-64">
                <input
                  type="text"
                  placeholder="البحث عن معلم..."
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                إضافة معلم
              </button>
            </div>
          </div>
          
          {loading.teachers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-1/2 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : teachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow text-center p-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                    {teacher.avatar ? (
                      <Image 
                        src={teacher.avatar} 
                        alt={teacher.name} 
                        width={96} 
                        height={96} 
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <FaChalkboardTeacher className="text-blue-400" size={30} />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{teacher.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{teacher.email}</p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {teacher.bio}
                  </p>
                  
                  <div className="flex justify-center mb-4 space-x-4">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{teacher.courses}</p>
                      <p className="text-gray-500 text-xs">دورات</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{teacher.students}</p>
                      <p className="text-gray-500 text-xs">طلاب</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-yellow-600">{teacher.rating}/5</p>
                      <p className="text-gray-500 text-xs">تقييم</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    <button
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="عرض"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="تعديل"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:text-red-800"
                      title="حذف"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaChalkboardTeacher className="mx-auto text-gray-300 text-5xl mb-4" />
              <p className="text-gray-500 text-lg">لا يوجد معلمون</p>
            </div>
          )}
        </div>
      )}
      
      {/* Estudiantes */}
      {activeView === 'students' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">إدارة الطلاب</h2>
            <div className="relative mr-0 md:mr-4 mb-2 md:mb-0 w-full md:w-64">
              <input
                type="text"
                placeholder="البحث عن طالب..."
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
          
          {loading.students ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-16 bg-gray-100 mb-2 rounded"></div>
              ))}
            </div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-right">اسم الطالب</th>
                    <th className="py-3 px-6 text-right">البريد الإلكتروني</th>
                    <th className="py-3 px-6 text-right">رقم الهاتف</th>
                    <th className="py-3 px-6 text-right">الدورات المسجلة</th>
                    <th className="py-3 px-6 text-right">تاريخ الانضمام</th>
                    <th className="py-3 px-6 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end">
                          <div className="ml-3">
                            <div className="font-medium">{student.name}</div>
                          </div>
                          {student.avatar && (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                              <Image 
                                src={student.avatar} 
                                alt={student.name} 
                                width={32} 
                                height={32} 
                                className="object-cover w-full h-full" 
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right">{student.email}</td>
                      <td className="py-3 px-6 text-right">{student.phone}</td>
                      <td className="py-3 px-6 text-right">{student.enrolledCourses}</td>
                      <td className="py-3 px-6 text-right">{new Date(student.joinDate).toLocaleDateString('ar-SA')}</td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex item-center justify-end">
                          <button
                            className="transform hover:text-blue-500 hover:scale-110 transition-all duration-150 mr-2"
                            title="عرض"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="transform hover:text-red-500 hover:scale-110 transition-all duration-150"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FaUserGraduate className="mx-auto text-gray-300 text-5xl mb-4" />
              <p className="text-gray-500 text-lg">لا يوجد طلاب</p>
            </div>
          )}
        </div>
      )}
      {/* Modal de Añadir Curso */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">إضافة دورة جديدة</h3>
              <button 
                onClick={() => setShowAddCourseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
              <form onSubmit={handleAddCourse}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      عنوان الدورة *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أدخل عنوان الدورة"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      وصف الدورة *
                    </label>
                    <textarea
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="أدخل وصف الدورة"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      الفئة *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                    >
                      <option value="" disabled>اختر الفئة</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      المستوى *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                    >
                      {availableLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      السعر *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أدخل سعر الدورة"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({...newCourse, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      سعر الخصم (اختياري)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أدخل سعر الخصم"
                      value={newCourse.discountPrice !== null ? newCourse.discountPrice : ''}
                      onChange={(e) => setNewCourse({
                        ...newCourse, 
                        discountPrice: e.target.value ? parseFloat(e.target.value) : null
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={newCourse.isPaid}
                        onChange={(e) => setNewCourse({...newCourse, isPaid: e.target.checked})}
                      />
                      <span className="mr-2 text-gray-700">مدفوع</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={newCourse.isPublished}
                        onChange={(e) => setNewCourse({...newCourse, isPublished: e.target.checked})}
                      />
                      <span className="mr-2 text-gray-700">منشور</span>
                    </label>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      صورة الغلاف
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                      
                      {thumbnailPreview ? (
                        <div className="mb-4">
                          <img
                            src={thumbnailPreview}
                            alt="Course thumbnail preview"
                            className="max-h-64 mx-auto rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-500 mb-4">
                          <FaUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                          <p>اضغط لاختيار صورة</p>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        {thumbnailPreview ? 'تغيير الصورة' : 'اختيار صورة'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 border-t pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddCourseModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    disabled={loading.courses}
                  >
                    {loading.courses ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ الدورة'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Editar Curso */}
      {showEditCourseModal && currentCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">تعديل الدورة</h3>
              <button 
                onClick={() => setShowEditCourseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
              <form onSubmit={handleEditCourse}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      عنوان الدورة *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أدخل عنوان الدورة"
                      value={currentCourse.title}
                      onChange={(e) => setCurrentCourse({...currentCourse, title: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      وصف الدورة *
                    </label>
                    <textarea
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="أدخل وصف الدورة"
                      value={currentCourse.description}
                      onChange={(e) => setCurrentCourse({...currentCourse, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      الفئة *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentCourse.category}
                      onChange={(e) => setCurrentCourse({...currentCourse, category: e.target.value})}
                    >
                      <option value="" disabled>اختر الفئة</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      المستوى *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentCourse.level}
                      onChange={(e) => setCurrentCourse({...currentCourse, level: e.target.value})}
                    >
                      {availableLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      السعر *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أدخل سعر الدورة"
                      value={currentCourse.price}
                      onChange={(e) => setCurrentCourse({...currentCourse, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      سعر الخصم (اختياري)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أدخل سعر الخصم"
                      value={currentCourse.discountPrice !== null ? currentCourse.discountPrice : ''}
                      onChange={(e) => setCurrentCourse({
                        ...currentCourse, 
                        discountPrice: e.target.value ? parseFloat(e.target.value) : null
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={currentCourse.isPaid}
                        onChange={(e) => setCurrentCourse({...currentCourse, isPaid: e.target.checked})}
                      />
                      <span className="mr-2 text-gray-700">مدفوع</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={currentCourse.isPublished}
                        onChange={(e) => setCurrentCourse({...currentCourse, isPublished: e.target.checked})}
                      />
                      <span className="mr-2 text-gray-700">منشور</span>
                    </label>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      صورة الغلاف
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                      
                      {thumbnailPreview ? (
                        <div className="mb-4">
                          <img
                            src={thumbnailPreview}
                            alt="Course thumbnail preview"
                            className="max-h-64 mx-auto rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-500 mb-4">
                          <FaUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                          <p>اضغط لاختيار صورة</p>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        {thumbnailPreview ? 'تغيير الصورة' : 'اختيار صورة'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 border-t pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditCourseModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    disabled={loading.courses}
                  >
                    {loading.courses ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ التغييرات'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
    </AdminLayout>
  );
}
