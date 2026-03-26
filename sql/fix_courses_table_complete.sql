-- إصلاح شامل لجدول الكورسات
-- ========================================

-- 1. التأكد من وجود extension لـ UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. إعادة إنشاء جدول الكورسات بالبنية الصحيحة
DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_name VARCHAR(255) DEFAULT 'مدرس المنصة',
    price DECIMAL(10,2) DEFAULT 0,
    duration_hours INT DEFAULT 1,
    level VARCHAR(50) DEFAULT 'beginner',
    category VARCHAR(100) DEFAULT 'general',
    thumbnail TEXT DEFAULT '/placeholder-course.png',
    preview_video TEXT,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    discount_price DECIMAL(10,2),
    enrollment_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. إضافة فهارس للأداء
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_level ON courses(level);

-- 4. تعطيل RLS مؤقتاً للاختبار
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 5. إضافة بيانات تجريبية
INSERT INTO courses (title, description, instructor_name, price, duration_hours, level, category, is_published)
VALUES 
    ('تعلم JavaScript من الصفر', 'كورس شامل لتعلم JavaScript', 'أحمد محمد', 299, 20, 'beginner', 'programming', true),
    ('React.js للمبتدئين', 'بناء تطبيقات ويب حديثة', 'سارة أحمد', 399, 25, 'intermediate', 'web-development', true),
    ('Python للذكاء الاصطناعي', 'أساسيات Python و Machine Learning', 'محمد علي', 499, 30, 'advanced', 'data-science', true);

-- 6. التحقق من النتيجة
SELECT 'تم إنشاء جدول الكورسات بنجاح!' as result;
SELECT COUNT(*) as "عدد الكورسات" FROM courses;

-- 7. عرض بنية الجدول
SELECT 
    column_name as "العمود",
    data_type as "النوع",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;
