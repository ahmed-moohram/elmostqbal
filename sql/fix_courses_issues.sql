-- إصلاح مشاكل جدول الكورسات
-- =========================

-- 1. عرض كل الكورسات الموجودة
SELECT 'الكورسات الموجودة حالياً:' as info;
SELECT 
  id,
  title,
  is_published,
  created_at
FROM courses
ORDER BY created_at DESC
LIMIT 10;

-- 2. التأكد من أن الـ ID من نوع UUID
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'courses' 
AND column_name = 'id';

-- 3. نشر جميع الكورسات (إزالة قيد المسودة)
UPDATE courses 
SET is_published = true 
WHERE is_published = false;

-- 4. إضافة كورس تجريبي إذا لم توجد كورسات
INSERT INTO courses (
  title, 
  description, 
  instructor_name, 
  price, 
  level, 
  category, 
  is_published,
  thumbnail
)
SELECT 
  'كورس تجريبي للاختبار',
  'هذا كورس تجريبي لاختبار العرض',
  'مدرس تجريبي',
  0,
  'beginner',
  'test',
  true,
  '/placeholder-course.png'
WHERE NOT EXISTS (SELECT 1 FROM courses LIMIT 1);

-- 5. عرض عدد الكورسات بعد الإصلاح
SELECT 
  COUNT(*) as total_courses,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_courses,
  COUNT(CASE WHEN is_published = false THEN 1 END) as draft_courses
FROM courses;

-- 6. عرض آخر 3 كورسات تم إنشاؤها مع الـ IDs
SELECT 'آخر 3 كورسات تم إنشاؤها:' as info;
SELECT 
  id as "Course ID",
  title as "العنوان",
  is_published as "منشور",
  created_at as "تاريخ الإنشاء"
FROM courses
ORDER BY created_at DESC
LIMIT 3;
