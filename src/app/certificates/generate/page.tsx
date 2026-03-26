'use client';

import { useState, useEffect, useRef } from 'react';
import supabase from '@/lib/supabase-client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaCertificate, FaDownload, FaShare, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// استخدام عميل Supabase الموحد

interface Certificate {
  id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  instructor_name: string;
  issue_date: string;
  certificate_number: string;
  completion_percentage: number;
  grade?: string;
  verification_url?: string;
  is_verified: boolean;
  metadata?: any;
}

export default function CertificateGenerator() {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    fetchStudentCertificates();
  }, []);

  const fetchStudentCertificates = async () => {
    try {
      // جلب بيانات الطالب من قاعدة البيانات
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // جلب الشهادات من قاعدة البيانات
      const { data: certs, error } = await supabase
        .from('certificates')
        .select(`
          *,
          courses:course_id (
            title,
            price,
            instructor_id,
            instructor_user:users!courses_instructor_id_fkey(
              name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('issue_date', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
        toast.error('حدث خطأ في جلب الشهادات');
        return;
      }

      const normalizedCertificates = (certs || []).map((cert: any) => {
        const derivedInstructorName =
          cert?.instructor_name ||
          cert?.courses?.instructor_user?.name ||
          'غير محدد';

        const derivedCourseName =
          cert?.course_name ||
          cert?.courses?.title ||
          cert?.course_name;

        return {
          ...cert,
          course_name: derivedCourseName,
          instructor_name: derivedInstructorName,
        };
      });

      setCertificates(normalizedCertificates);

      // جلب بيانات الطالب
      const { data: student } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setStudentData(student);
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ');
    }
  };

  const generateCertificate = async (courseId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('يجب تسجيل الدخول');
        return;
      }

      // التحقق من إتمام الكورس
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses:course_id(
            *,
            instructor_user:users!courses_instructor_id_fkey(
              name
            )
          )
        `)
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (enrollmentError || !enrollment) {
        toast.error('لم تسجل في هذا الكورس');
        return;
      }

      if (enrollment.progress_percentage < 80) {
        toast.error('يجب إكمال 80% على الأقل من الكورس');
        return;
      }

      // إنشاء رقم شهادة فريد
      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const verificationUrl = `https://platform.edu/verify/${certificateNumber}`;

      const resolvedInstructorName =
        (enrollment as any)?.courses?.instructor_user?.name ||
        (enrollment as any)?.courses?.instructor ||
        'غير محدد';

      // حفظ الشهادة في قاعدة البيانات
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          student_id: user.id,
          student_name: studentData?.name || user.email,
          course_id: courseId,
          course_name: enrollment.courses.title,
          instructor_name: resolvedInstructorName,
          certificate_number: certificateNumber,
          completion_percentage: enrollment.progress_percentage,
          grade: calculateGrade(enrollment.progress_percentage),
          verification_url: verificationUrl,
          is_verified: true,
          issue_date: new Date().toISOString(),
          metadata: {
            total_hours: enrollment.courses.duration_hours,
            lessons_completed: enrollment.completed_lessons?.length || 0
          }
        })
        .select()
        .single();

      if (certError) {
        console.error('Error creating certificate:', certError);
        toast.error('حدث خطأ في إنشاء الشهادة');
        return;
      }

      setSelectedCertificate(certificate);
      toast.success('تم إنشاء الشهادة بنجاح!');
      
      // إرسال إشعار
      await sendCertificateNotification(user.id, certificate);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ في إنشاء الشهادة');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (percentage: number): string => {
    if (percentage >= 95) return 'امتياز';
    if (percentage >= 85) return 'جيد جداً';
    if (percentage >= 75) return 'جيد';
    if (percentage >= 65) return 'مقبول';
    return 'ناجح';
  };

  const downloadCertificatePDF = async () => {
    if (!certificateRef.current || !selectedCertificate) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${selectedCertificate.certificate_number}.pdf`);

      toast.success('تم تحميل الشهادة بنجاح!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ في تحميل الشهادة');
    }
  };

  const shareCertificate = async () => {
    if (!selectedCertificate) return;

    const shareData = {
      title: 'شهادة إتمام الكورس',
      text: `لقد أتممت كورس ${selectedCertificate.course_name} بنجاح!`,
      url: selectedCertificate.verification_url || window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        navigator.clipboard.writeText(selectedCertificate.verification_url || window.location.href);
        toast.success('تم نسخ رابط الشهادة!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const sendCertificateNotification = async (userId: string, certificate: Certificate) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'مبروك! شهادة جديدة',
          message: `تهانينا! لقد حصلت على شهادة إتمام كورس ${certificate.course_name}`,
          type: 'certificate',
          link: `/certificates/${certificate.id}`,
          metadata: {
            certificate_id: certificate.id,
            course_name: certificate.course_name
          }
        });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            شهاداتي
          </h1>
          <p className="text-gray-600">احصل على شهادات معتمدة لإثبات إنجازاتك</p>
        </div>

        {/* Certificates List */}
        {!selectedCertificate ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <motion.div
                key={cert.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-lg p-6 cursor-pointer"
                onClick={() => setSelectedCertificate(cert)}
              >
                <div className="flex items-center justify-between mb-4">
                  <FaCertificate className="text-4xl text-yellow-500" />
                  {cert.is_verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <FaCheck className="mr-1" /> معتمدة
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-2">{cert.course_name}</h3>
                <p className="text-sm text-gray-600 mb-1">المدرس: {cert.instructor_name}</p>
                <p className="text-sm text-gray-600 mb-1">التاريخ: {new Date(cert.issue_date).toLocaleDateString('ar')}</p>
                <p className="text-sm text-gray-600">التقدير: {cert.grade}</p>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                    عرض
                  </button>
                  <button className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm hover:bg-gray-300 transition">
                    تحميل
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Certificate Preview */
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex gap-4">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                رجوع
              </button>
              <button
                onClick={downloadCertificatePDF}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaDownload /> تحميل PDF
              </button>
              <button
                onClick={shareCertificate}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <FaShare /> مشاركة
              </button>
            </div>

            {/* Certificate Design */}
            <div
              ref={certificateRef}
              className="bg-white p-12 rounded-xl shadow-2xl border-8 border-double border-yellow-500"
              style={{
                backgroundImage: 'url("/certificate-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="text-center">
                <div className="mb-6">
                  <FaCertificate className="text-6xl text-yellow-600 mx-auto mb-4" />
                  <h1 className="text-5xl font-bold mb-2 text-gray-800" style={{ fontFamily: 'serif' }}>
                    شهادة إتمام
                  </h1>
                  <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto"></div>
                </div>

                <div className="mb-8">
                  <p className="text-xl mb-4 text-gray-700">يشهد هذا بأن</p>
                  <h2 className="text-4xl font-bold text-blue-800 mb-6">{selectedCertificate.student_name}</h2>
                  <p className="text-xl mb-2 text-gray-700">قد أتم بنجاح دورة</p>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">{selectedCertificate.course_name}</h3>
                  <p className="text-lg text-gray-600">تحت إشراف: {selectedCertificate.instructor_name}</p>
                </div>

                <div className="grid grid-cols-3 gap-8 mb-8">
                  <div>
                    <p className="text-sm text-gray-600">التقدير</p>
                    <p className="font-bold text-lg">{selectedCertificate.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">نسبة الإنجاز</p>
                    <p className="font-bold text-lg">{selectedCertificate.completion_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">التاريخ</p>
                    <p className="font-bold text-lg">{new Date(selectedCertificate.issue_date).toLocaleDateString('ar')}</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="w-32 h-1 bg-gray-800 mb-2"></div>
                      <p className="text-sm">توقيع المدير</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">رقم الشهادة</p>
                      <p className="font-mono text-sm">{selectedCertificate.certificate_number}</p>
                    </div>
                    <div>
                      <div className="w-32 h-1 bg-gray-800 mb-2"></div>
                      <p className="text-sm">ختم المنصة</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    للتحقق من صحة الشهادة: {selectedCertificate.verification_url}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
