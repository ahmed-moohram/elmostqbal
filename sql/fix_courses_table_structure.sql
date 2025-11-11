-- ========================================
-- إصلاح هيكل جدول courses
-- Fix Courses Table Structure
-- ========================================

-- 1. عرض الأعمدة الحالية في جدول courses
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- 2. إزالة قيد NOT NULL من instructor_name إذا كان موجوداً
ALTER TABLE courses ALTER COLUMN instructor_name DROP NOT NULL;

-- 3. إضافة عمود instructor_id إذا لم يكن موجوداً
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 4. إضافة الأعمدة المفقودة الأخرى
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_hours INT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS students_count INT DEFAULT 0;

-- 5. الآن يمكنك إضافة البيانات التجريبية مع instructor_name كـ NULL أو قيمة افتراضية
INSERT INTO courses (
    title, 
    description, 
    category, 
    level, 
    price, 
    duration_hours, 
    is_published,
    instructor_name  -- إضافة قيمة افتراضية
) 
VALUES 
    ('أساسيات البرمجة بلغة Python', 'تعلم البرمجة من الصفر مع Python', 'برمجة', 'مبتدئ', 299, 20, true, 'مدرب افتراضي'),
    ('تطوير تطبيقات الويب', 'HTML, CSS, JavaScript من البداية للاحتراف', 'تطوير ويب', 'متوسط', 499, 30, true, 'مدرب افتراضي'),
    ('الذكاء الاصطناعي للمبتدئين', 'مقدمة في AI و Machine Learning', 'ذكاء اصطناعي', 'مبتدئ', 699, 40, true, 'مدرب افتراضي')
ON CONFLICT DO NOTHING;

-- 6. إضافة إنجازات تجريبية
INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value)
VALUES 
    ('البداية الموفقة', 'أكمل درسك الأول', '🎯', 'learning', 10, 'lessons_completed', 1),
    ('الطالب المجتهد', 'أكمل 5 دروس', '📚', 'learning', 25, 'lessons_completed', 5),
    ('النجم الصاعد', 'أكمل دورة كاملة', '⭐', 'completion', 100, 'courses_completed', 1),
    ('المثابر', 'ادرس لمدة 7 أيام متتالية', '🔥', 'participation', 50, 'study_streak', 7),
    ('العبقري', 'احصل على 90% أو أكثر في اختبار', '🏆', 'excellence', 75, 'quiz_score', 90)
ON CONFLICT DO NOTHING;

-- 7. عرض الكورسات المضافة
SELECT 
    id,
    title,
    category,
    level,
    price,
    duration_hours,
    is_published,
    instructor_name
FROM courses
ORDER BY created_at DESC
LIMIT 5;

-- رسالة النجاح
SELECT '✅ تم إصلاح جدول courses وإضافة البيانات التجريبية بنجاح!' as message;
