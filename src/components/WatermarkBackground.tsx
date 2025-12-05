"use client";

import { useEffect, useState } from 'react';

// مكون لإضافة علامة مائية متكررة في خلفية الموقع بأكمله
export default function WatermarkBackground() {
  const [userPhone, setUserPhone] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [watermarks, setWatermarks] = useState<JSX.Element[]>([]);

  // استيراد بيانات المستخدم وإنشاء العلامات المائية
  useEffect(() => {
    // التحقق مما إذا كان المستخدم مسجل الدخول
    const user = localStorage.getItem('user');
    if (!user) return;
    
    try {
      const userData = JSON.parse(user);
      const phone = userData.phone || '';
      const name = userData.name || '';
      
      if (!phone && !name) return;
      
      setUserPhone(phone);
      setUserName(name);
      
      // إنشاء العلامات المائية بعد تحديث بيانات المستخدم
      generateWatermarks(name, phone);
    } catch (error) {
      console.error('خطأ في استيراد بيانات المستخدم', error);
    }
  }, []);

  // إنشاء العلامات المائية
  const generateWatermarks = (name: string, phone: string) => {
    const marks = [];
    const spacing = 300; // المسافة بين العلامات المائية
    const rows = Math.ceil(5000 / spacing); // عدد الصفوف (نفترض ارتفاع الصفحة 5000px كحد أقصى)
    const cols = Math.ceil(window.innerWidth / spacing); // عدد الأعمدة
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // إنشاء علامات مائية متباعدة
        marks.push(
          <div
            key={`watermark-${i}-${j}`}
            className="absolute text-xl font-bold text-black opacity-[0.03] pointer-events-none select-none"
            style={{
              top: i * spacing + Math.random() * 100, // إضافة عشوائية للموقع
              left: j * spacing + Math.random() * 100,
              transform: `rotate(${-15 + Math.random() * 10}deg)`, // تدوير عشوائي
            }}
          >
            {name} {phone}
          </div>
        );
      }
    }
    
    setWatermarks(marks);
  };

  // إعادة إنشاء العلامات المائية عند تغيير حجم النافذة
  useEffect(() => {
    if (!userPhone && !userName) return;
    
    const handleResize = () => {
      generateWatermarks(userName, userPhone);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [userPhone, userName]);

  // إذا لم يكن هناك بيانات مستخدم، لا نعرض شيئاً
  if (!userPhone && !userName) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {watermarks}
    </div>
  );
} 