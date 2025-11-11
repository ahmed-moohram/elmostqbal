-- ========================================
-- حل بسيط ومباشر
-- Simple Direct Solution
-- ========================================

-- الخيار 1: إزالة قيد NOT NULL من instructor_name
DO $$
BEGIN
    -- محاولة إزالة قيد NOT NULL
    ALTER TABLE courses ALTER COLUMN instructor_name DROP NOT NULL;
    RAISE NOTICE 'تم إزالة قيد NOT NULL من instructor_name';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'العمود instructor_name قد يكون غير موجود أو القيد غير موجود';
END $$;

-- الخيار 2: إضافة قيمة افتراضية للعمود
ALTER TABLE courses ALTER COLUMN instructor_name SET DEFAULT 'مدرب المنصة';

-- إضافة الأعمدة المفقودة
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_hours INT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- إضافة البيانات مع تحديد instructor_name
INSERT INTO courses (
    title, 
    description, 
    category, 
    level, 
    price, 
    duration_hours, 
    is_published,
    instructor_name
) 
VALUES 
    ('أساسيات البرمجة بلغة Python', 'تعلم البرمجة من الصفر مع Python', 'برمجة', 'مبتدئ', 299, 20, true, 'أ. محمد أحمد'),
    ('تطوير تطبيقات الويب', 'HTML, CSS, JavaScript من البداية للاحتراف', 'تطوير ويب', 'متوسط', 499, 30, true, 'أ. سارة محمود'),
    ('الذكاء الاصطناعي للمبتدئين', 'مقدمة في AI و Machine Learning', 'ذكاء اصطناعي', 'مبتدئ', 699, 40, true, 'د. أحمد علي')
ON CONFLICT DO NOTHING;

-- عرض النتائج
SELECT 
    title,
    instructor_name,
    category,
    price,
    is_published
FROM courses
WHERE is_published = true
ORDER BY created_at DESC;

-- رسالة النجاح
SELECT '✅ تم الإصلاح وإضافة الكورسات بنجاح!' as message;
