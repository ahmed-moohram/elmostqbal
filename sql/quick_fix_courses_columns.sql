-- ========================================
-- إصلاح سريع - إضافة الأعمدة المفقودة لجدول courses
-- Quick Fix - Add Missing Columns to Courses Table
-- ========================================

-- إضافة الأعمدة المفقودة مباشرة (بدون فحص)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_hours INT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS students_count INT DEFAULT 0;

-- عرض أعمدة الجدول للتأكد
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- الآن يمكنك إضافة البيانات التجريبية
INSERT INTO courses (title, description, category, level, price, duration_hours, is_published) 
VALUES 
    ('أساسيات البرمجة بلغة Python', 'تعلم البرمجة من الصفر مع Python', 'برمجة', 'مبتدئ', 299, 20, true),
    ('تطوير تطبيقات الويب', 'HTML, CSS, JavaScript من البداية للاحتراف', 'تطوير ويب', 'متوسط', 499, 30, true),
    ('الذكاء الاصطناعي للمبتدئين', 'مقدمة في AI و Machine Learning', 'ذكاء اصطناعي', 'مبتدئ', 699, 40, true)
ON CONFLICT DO NOTHING;

-- رسالة النجاح
SELECT '✅ تم إضافة الأعمدة المفقودة بنجاح!' as message;
