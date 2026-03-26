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

-- رسالة النجاح
SELECT '✅ تم إضافة الأعمدة المفقودة بنجاح!' as message;
