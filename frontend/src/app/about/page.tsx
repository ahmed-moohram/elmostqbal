'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaChalkboardTeacher, FaUsers, FaCertificate, FaAward, FaLaptop, FaBook, FaStar } from 'react-icons/fa';

export default function AboutPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const features = [
    {
      icon: <FaGraduationCap className="text-4xl text-primary" />,
      title: "منهج تعليمي متكامل",
      description: "مناهج تعليمية مصممة من قبل خبراء تربويين لضمان تعلم فعال وممتع"
    },
    {
      icon: <FaChalkboardTeacher className="text-4xl text-primary" />,
      title: "نخبة من المعلمين",
      description: "فريق من المدرسين ذوي الخبرة والكفاءة في مجالات تخصصهم"
    },
    {
      icon: <FaLaptop className="text-4xl text-accent" />,
      title: "تقنيات تعليمية حديثة",
      description: "نستخدم أحدث التقنيات لتقديم تجربة تعليمية تفاعلية وفعالة"
    },
    {
      icon: <FaAward className="text-4xl text-secondary" />,
      title: "شهادات معتمدة",
      description: "شهادات إتمام معترف بها تؤهلك للنجاح في المراحل التعليمية المختلفة"
    }
  ];

  const stats = [
    {
      title: "طالب",
      value: "1000+",
      icon: <FaUsers />,
      color: "from-blue-400 to-blue-600",
    },
    {
      title: "معلم",
      value: "20+",
      icon: <FaChalkboardTeacher />,
      color: "from-purple-400 to-purple-600",
    },
    {
      title: "دورة تعليمية",
      value: "50+",
      icon: <FaBook />,
      color: "from-green-400 to-green-600",
    },
    {
      title: "معدل الرضا",
      value: "98%",
      icon: <FaStar />,
      color: "from-yellow-400 to-yellow-600",
    }
  ];

  const testimonials = [
    {
      name: "أحمد محمود",
      role: "طالب ثانوية عامة",
      image: "/testimonial1.jpg",
      content: "منصة المستقبل التعليمية ساعدتني في تحقيق درجات مرتفعة في الثانوية العامة والالتحاق بكلية الطب."
    },
    {
      name: "سارة علي",
      role: "ولي أمر",
      image: "/testimonial2.jpg",
      content: "لاحظت تحسناً كبيراً في مستوى ابنتي بعد الانضمام للمنصة. المدرسون ممتازون والمحتوى التعليمي عالي الجودة."
    },
    {
      name: "محمد إبراهيم",
      role: "مدرس لغة إنجليزية",
      image: "/testimonial3.jpg",
      content: "استطعت من خلال المنصة الوصول لطلاب من مختلف المحافظات وتقديم تعليم عالي الجودة دون قيود المكان."
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-white to-secondary/10 dark:from-primary/20 dark:via-gray-900 dark:to-secondary/20">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="heading-1 mb-6"
              >
                عن منصة <span className="text-primary">المستقبل</span> التعليمية
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="body-text mb-8 text-lg"
              >
                منصة تعليمية رائدة في مجال التعليم الإلكتروني، تهدف لتقديم محتوى تعليمي عالي الجودة للطلاب في جميع المراحل التعليمية. نحن نؤمن بحق كل طالب في الحصول على تعليم متميز بغض النظر عن موقعه الجغرافي أو ظروفه الاقتصادية.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link href="/courses" className="btn-modern mr-4">استعرض الدورات</Link>
                {/* زر "تواصل معنا" تمت إزالته بناءً على طلب الإدارة */}
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="md:w-1/2 relative"
            >
              <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <Image
                    src="/logo.png"
                    alt="شعار منصة المستقبل التعليمية"
                    fill
                    className="object-contain"
                    style={{ 
                      filter: 'drop-shadow(0 10px 15px rgba(66, 56, 157, 0.3))',
                      animation: 'pulse 3s infinite ease-in-out'
                    }}
                    priority
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"></div>
                
                <style jsx>{`
                  @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                  }
                `}</style>
              </div>
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 glass-royal p-4 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FaGraduationCap className="text-3xl text-primary" />
                  <div>
                    <p className="text-gray-800 dark:text-white font-bold">رؤيتنا</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">تعليم متميز لكل طالب</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="featured-title mb-6">ما يميزنا</h2>
            <p className="body-text max-w-2xl mx-auto">
              نسعى دائماً لتقديم أفضل تجربة تعليمية للطلاب من خلال مجموعة من المميزات الفريدة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="card-modern text-center"
              >
                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="featured-title mb-6">لمحة من منصتنا</h2>
            <p className="body-text max-w-2xl mx-auto">
              تعرف على بيئة التعلم الإلكتروني المتكاملة التي نقدمها لطلابنا
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* تم إزالة صور المنصة */}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="card-modern text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-lg opacity-70 -mt-px"
                     style={{
                       backgroundImage: `linear-gradient(to right, ${stat.color.split(' ')[0].replace('from-', '')}, ${stat.color.split(' ')[1].replace('to-', '')})`
                     }}
                ></div>
                <div className="mb-4 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.color} text-white text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 dark:text-white">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* تم إزالة قسم إدارة الصور */}

      {/* تم إزالة قسم الدعوة للانضمام بناءً على طلب الإدارة */}
    </div>
  );
}