'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaChalkboardTeacher, FaBookOpen, FaStar, FaRocket, FaSmile, FaChartBar, FaGraduationCap, FaLaptop, FaCertificate, FaCheckCircle, FaPlay, FaCalendarAlt, FaUsers, FaFacebook, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { Cairo } from 'next/font/google';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase-client';
const cairo = Cairo({ subsets: ['latin'], weight: ['400', '700'] });

// سيتم جلب الدورات المميزة من API

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const ctaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated, user: authUser } = useAuth();
  const [user, setUser] = useState({ name: '', image: '/placeholder-profile.jpg' });
  const [featuredTeachers, setFeaturedTeachers] = useState<any[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({ students: 0, courses: 0, teachers: 0 });

  const features = [
    {
      icon: <FaGraduationCap className="text-6xl text-primary" />,
      title: "تعلم من الخبراء",
      description: "دورات مع نخبة من أفضل المدرسين والخبراء في مجالهم"
    },
    {
      icon: <FaLaptop className="text-6xl text-accent" />,
      title: "تعلم في أي وقت",
      description: "منصة تفاعلية متاحة 24/7 للتعلم في أي وقت ومن أي مكان"
    },
    {
      icon: <FaCertificate className="text-6xl text-primary" />,
      title: "شهادات معتمدة",
      description: "احصل على شهادات معتمدة تؤهلك لسوق العمل"
    }
  ];

  // بيانات المستخدم ديناميكية من LocalStorage
  useEffect(() => {
    // التحقق من وجود مستخدم مسجّل و ما إذا كان هذا دخوله الأول بعد التسجيل
    const storedUser = localStorage.getItem('user');
    const justRegistered = localStorage.getItem('justRegistered') === 'true';
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
      setUser({ 
        name: parsedUser.name || '', 
        image: parsedUser.image || parsedUser.avatar_url || '/placeholder-profile.jpg' 
      });
      
      // إذا كان المستخدم توه مسجّل جديد، اعرض رسالة الترحيب مرة واحدة فقط
      if (justRegistered && !sessionStorage.getItem('welcomeShown')) {
        setShowWelcome(true);
        sessionStorage.setItem('welcomeShown', 'true');
        localStorage.removeItem('justRegistered');
        
        // إخفاء الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
          setShowWelcome(false);
        }, 5000);
      }
    } else {
      const name = localStorage.getItem('userName') || '';
      const image = localStorage.getItem('userImage') || '/placeholder-profile.jpg';
      setUser({ name, image });
    }
  }, []);

  // جلب المدرسين المميزين من Supabase
  useEffect(() => {
    const fetchFeaturedTeachers = async () => {
      try {
        console.log('🔄 جلب المدرسين المميزين من Supabase...');

        const { data: teacherRows, error: teachersError } = await supabase
          .from('teachers')
          .select('*')
          .eq('is_featured', true)
          .limit(6);

        if (teachersError) {
          console.error('❌ خطأ في جلب المدرسين المميزين:', teachersError);
          setFeaturedTeachers([]);
          return;
        }

        if (!teacherRows || teacherRows.length === 0) {
          setFeaturedTeachers([]);
          return;
        }

        const userIds = teacherRows.map((t: any) => t.user_id).filter(Boolean);

        const { data: usersRows, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ خطأ في جلب بيانات مستخدمي المدرسين:', usersError);
        }

        const usersMap = new Map(
          (usersRows || []).map((u: any) => [u.id, u])
        );

        const formatted = teacherRows.map((t: any) => {
          const user = usersMap.get(t.user_id) || {};

          let avatar = t.avatar_url || user.avatar_url || '/placeholder-avatar.png';

          if (authUser && authUser.id === t.user_id && (authUser as any).image) {
            avatar = (authUser as any).image;
          }

          return {
            id: t.user_id,
            teacherId: t.id,
            name: user.name || 'مدرس',
            avatar,
            specialization: t.specialization || 'غير محدد',
            rating: Number(t.rating) || 0,
            students: t.total_students ?? 0,
            courses: t.total_courses ?? 0,
          };
        });

        console.log('👨‍🏫 Featured teachers data:', formatted);

        setFeaturedTeachers(formatted);
      } catch (error) {
        console.error('❌ خطأ غير متوقع في جلب المدرسين المميزين:', error);
        setFeaturedTeachers([]);
      }
    };

    fetchFeaturedTeachers();
  }, [authUser]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, coursesRes, teachersRes] = await Promise.all([
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student'),
          supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .eq('is_published', true),
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'teacher'),
        ]);

        if (studentsRes.error) console.error('❌ خطأ في حساب عدد الطلاب:', studentsRes.error);
        if (coursesRes.error) console.error('❌ خطأ في حساب عدد الكورسات:', coursesRes.error);
        if (teachersRes.error) console.error('❌ خطأ في حساب عدد المدرسين:', teachersRes.error);

        setStats({
          students: studentsRes.count || 0,
          courses: coursesRes.count || 0,
          teachers: teachersRes.count || 0,
        });
      } catch (error) {
        console.error('❌ خطأ غير متوقع في جلب إحصائيات المنصة:', error);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userImage');
    router.replace('/login');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartClick = () => {
    router.replace('/register');
  };

  if (isLoading) {
    return <LoadingScreen imageUrl="/logo.png" onLoadingComplete={() => {}} />;
  }

  return (
    <div className={cairo.className}>
      {/* رسالة ترحيب للمستخدم الجديد */}
      <AnimatePresence>
        {showWelcome && userData && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.5 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg shadow-2xl max-w-md"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">🎉 مرحباً بك {userData.name}!</h2>
              <p className="text-white/90">تم إنشاء حسابك بنجاح</p>
              <div className="mt-3 space-y-1 text-sm text-white/80">
                {userData.gradeLevel && <p>📚 الصف: {userData.gradeLevel}</p>}
                {userData.city && <p>📍 المدينة: {userData.city}</p>}
                {userData.schoolName && <p>🏫 المدرسة: {userData.schoolName}</p>}
              </div>
              <button 
                onClick={() => router.push('/courses')}
                className="mt-4 bg-white text-green-600 px-6 py-2 rounded-full font-bold hover:bg-green-50 transition"
              >
                استكشف الدورات
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-24 sm:pt-32">
        <div 
          className="absolute inset-0 z-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 dark:from-[#0a1730] dark:via-[#051123] dark:to-[#030c1a]"
        >
          <div className="absolute inset-0 dark:block hidden" 
            style={{
              background: 'radial-gradient(circle at 50% 70%, #0a2563 0%, rgba(3, 12, 34, 0) 65%)',
              opacity: 0.9
            }}
          />
          {/* إضافة غيوم للوضع الليلي */}
          <div className="absolute inset-0 opacity-10 dark:block hidden">
            <div className="absolute w-3/4 h-1/4 top-1/4 left-0 bg-gradient-to-r from-transparent via-gray-900 to-transparent blur-3xl"></div>
            <div className="absolute w-2/3 h-1/5 top-1/2 right-0 bg-gradient-to-l from-transparent via-gray-900 to-transparent blur-3xl"></div>
          </div>
          {/* إضافة غيوم للوضع الصباحي */}
          <div className="absolute inset-0 dark:hidden block">
            <div className="absolute w-3/4 h-1/4 top-1/4 left-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 blur-3xl"></div>
            <div className="absolute w-2/3 h-1/5 top-1/2 right-0 bg-gradient-to-l from-transparent via-white to-transparent opacity-40 blur-3xl"></div>
          </div>
        </div>
        <div className="z-10 relative">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Image 
                src="/logo.png" 
                alt="شعار المنصة"
                width={200}
                height={200}
                className="object-contain hover-glow transition-all duration-500 ease-in-out"
                priority 
              />
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse-slow -z-10"></div>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-gray-800 dark:text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-900 dark:from-white dark:to-gray-200">منصة</span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-700 dark:from-primary-dark dark:to-purple-400 animate-gradient bg-size-200">المستقبل</span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-900 dark:from-white dark:to-gray-200">التعليمية</span>
          </h1>
          <p className="max-w-xl mx-auto text-xl sm:text-2xl md:text-3xl text-gray-700 dark:text-white mb-12 leading-relaxed font-semibold">
            نحو جيل مبدع ومبتكر، مسلح بالعلم والمعرفة بأحدث التقنيات.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {!isAuthenticated && (
              <button onClick={handleStartClick} className="btn-royal py-4 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>ابدأ رحلتي</span>
                  <FaRocket className="inline-block transition-transform duration-500 group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-violet-800 group-hover:scale-110 transition-transform duration-500"></span>
              </button>
            )}
            <Link href="/courses" className="btn-gold py-4 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group relative overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>اكتشف الدورات</span>
                <FaBookOpen className="inline-block transition-transform duration-500 group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:scale-110 transition-transform duration-500"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <div className="mt-24">
        <AnimatePresence mode="wait">
        <motion.div
            key={activeFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              {features[activeFeature].icon}
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {features[activeFeature].title}
            </h3>
            <p className="body-text">
              {features[activeFeature].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-6">
          {features.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === activeFeature ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={() => setActiveFeature(index)}
            />
          ))}
        </div>
      </div>

      {/* Featured Teachers Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="featured-title">المدرسون المتميزون</h2>
            <p className="body-text max-w-2xl mx-auto">
              تعرّف على نخبة من أفضل المدرسين، واستكشف جميع دوراتهم التعليمية المميزة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredTeachers.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">لا يوجد مدرسون مميزون حالياً</p>
              </div>
            ) : (
              featuredTeachers.map((teacher) => (
                <Link
                  key={teacher.id}
                  href={`/teachers/${teacher.id}`}
                  className="group relative rounded-3xl overflow-hidden bg-gray-900/5 dark:bg-gray-800/40 border border-white/10 shadow-[0_14px_30px_rgba(15,23,42,0.45)] hover:-translate-y-3 hover:scale-[1.05] hover:shadow-[0_30px_70px_rgba(15,23,42,0.75)] transition-all duration-700 ease-out h-96"
                >
                  {/* صورة المدرس تغطي الكارت بالكامل */}
                  <Image
                    src={teacher.avatar || '/placeholder-avatar.png'}
                    alt={teacher.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                    className="object-cover transform filter brightness-[1.02] saturate-[1.05] group-hover:scale-110 group-hover:brightness-115 group-hover:saturate-130 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/22 to-transparent group-hover:from-black/55 group-hover:via-black/12 transition-colors duration-700 ease-out" />

                  {/* المحتوى فوق الصورة */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5 text-white opacity-95 transition-opacity duration-700 ease-out group-hover:opacity-85">
                    <div className="flex flex-col items-start gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/80 text-xs font-semibold">
                        <FaChalkboardTeacher className="text-white" />
                        <span>مدرس مميز</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-1 line-clamp-1">
                        {teacher.name}
                      </h3>
                      <p className="text-sm text-gray-100/90 line-clamp-1">
                        {teacher.specialization}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 shadow-lg transition-colors duration-500 ease-out group-hover:bg-white/16 group-hover:border-white/25">
                        <div className="flex items-center justify-between text-sm text-gray-100">
                          <div className="flex items-center gap-2">
                            <FaStar className="text-yellow-400" />
                            <span className="font-semibold">{teacher.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-200">تقييم الطلاب</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaUsers className="text-primary-light" />
                            <span className="font-semibold">{teacher.students || 0}</span>
                            <span className="text-xs text-gray-200">طالب</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary/95 text-white py-2.5 text-sm font-semibold hover:bg-primary-dark transition-transform duration-300 ease-out shadow-lg shadow-primary/40 hover:-translate-y-0.5"
                      >
                        عرض كورسات المدرس
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { number: stats.students.toLocaleString(), label: "طالب" },
              { number: stats.courses.toLocaleString(), label: "دورة تعليمية" },
              { number: stats.teachers.toLocaleString(), label: "مدرس متميز" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-card"
              >
                <div className="text-4xl font-bold gradient-text mb-2">
                  {stat.number}
                </div>
                <div className="text-xl text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="relative mb-4 p-2 rounded-lg overflow-hidden">
                {/* الخلفية المطلوبة خلف عنوان منصة المستقبل التعليمية */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(rgb(224, 242, 254), rgb(240, 249, 255))', opacity: 0.8 }}>
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgb(240, 249, 255) 0%, rgb(219, 234, 254) 100%)', opacity: 0.9 }}></div>
                </div>
                <h3 className="text-xl font-bold relative z-10 text-gray-800 p-2">منصة المستقبل التعليمية</h3>
              </div>
              <p className="text-gray-400">
                نحن نؤمن بقوة التعليم في تغيير حياة الأفراد وتطوير المجتمعات
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">روابط سريعة</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">الدورات</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">المدرسين</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">عن المنصة</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 gradient-text-gold">تواصل معنا</h3>
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-blue-600 hover:bg-blue-700 p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
                  >
                    <FaFacebook className="text-xl text-white" />
                  </motion.div>
                  <a
                    href="https://www.facebook.com/groups/1256199588821814/user/61561020877459?locale=ar_AR"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                  >
                    صفحتنا / جروبنا على الفيسبوك
                  </a>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-green-500 hover:bg-green-600 p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-green-500/50"
                  >
                    <FaWhatsapp className="text-xl text-white" />
                  </motion.div>
                  <a
                    href="https://wa.me/201070333143"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-green-400 transition-colors text-sm"
                  >
                    01070333143
                  </a>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-red-500 hover:bg-red-600 p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/50"
                  >
                    <FaEnvelope className="text-xl text-white" />
                  </motion.div>
                  <a href="mailto:info@edufutura.com" className="text-gray-400 hover:text-red-400 transition-colors text-sm">
                    info@edufutura.com
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            {new Date().getFullYear()}  جميع الحقوق محفوظة ©  أحمد محرم 
          </div>
        </div>
      </footer>
    </div>
  );
} 