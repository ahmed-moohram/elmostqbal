-- ========================================
-- فحص الجداول الموجودة وإصلاحها
-- Check and Fix Existing Tables
-- ========================================

-- 1. عرض الجداول الموجودة
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. عرض أعمدة جدول achievements إذا كان موجوداً
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'achievements'
ORDER BY ordinal_position;

-- 3. عرض أعمدة جدول user_achievements إذا كان موجوداً
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_achievements'
ORDER BY ordinal_position;

-- 4. عرض أعمدة جدول enrollments إذا كان موجوداً
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- ========================================
-- إصلاح سريع - إضافة الأعمدة المفقودة مباشرة
-- ========================================

-- إضافة course_id إلى achievements إذا لم يكن موجوداً
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- إضافة course_id و enrollment_id إلى user_achievements
ALTER TABLE user_achievements 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE user_achievements 
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;

-- إضافة enrollment_id إلى lesson_progress
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;

-- إضافة الأعمدة الإحصائية إلى user_points
ALTER TABLE user_points 
ADD COLUMN IF NOT EXISTS courses_completed INT DEFAULT 0;

ALTER TABLE user_points 
ADD COLUMN IF NOT EXISTS lessons_completed INT DEFAULT 0;

ALTER TABLE user_points 
ADD COLUMN IF NOT EXISTS achievements_earned INT DEFAULT 0;

-- إضافة أعمدة العلاقات إلى points_history
ALTER TABLE points_history 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE points_history 
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE points_history 
ADD COLUMN IF NOT EXISTS achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE;

-- ========================================
-- التحقق من النتائج
-- ========================================

-- عرض الأعمدة بعد الإصلاح
SELECT 
    'achievements' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'achievements'
AND column_name IN ('course_id')

UNION ALL

SELECT 
    'user_achievements' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'user_achievements'
AND column_name IN ('course_id', 'enrollment_id')

UNION ALL

SELECT 
    'lesson_progress' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'lesson_progress'
AND column_name IN ('enrollment_id')

UNION ALL

SELECT 
    'user_points' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'user_points'
AND column_name IN ('courses_completed', 'lessons_completed', 'achievements_earned')

UNION ALL

SELECT 
    'points_history' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'points_history'
AND column_name IN ('course_id', 'lesson_id', 'achievement_id')

ORDER BY table_name, column_name;
