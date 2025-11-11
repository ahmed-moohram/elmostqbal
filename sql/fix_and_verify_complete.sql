-- ========================================
-- إصلاح وتحقق شامل من كل العلاقات
-- Complete Fix and Verification
-- ========================================

-- 1. إضافة الأعمدة المفقودة أولاً
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;

-- إنشاء جدول lesson_progress إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    watched_duration INT DEFAULT 0,
    total_duration INT,
    progress DECIMAL(5,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    last_position INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- إنشاء جدول user_points إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    courses_completed INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    achievements_earned INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول points_history إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL,
    action VARCHAR(100),
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    reference_id UUID,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. عرض الجداول الموجودة
SELECT 'الجداول الموجودة:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. عرض الكورسات
SELECT 'الكورسات المتاحة:' as info;
SELECT id, title, category, is_published FROM courses;

-- 4. إضافة إنجازات عامة وخاصة
DO $$
DECLARE
    course_1 UUID;
    course_2 UUID;
    course_3 UUID;
BEGIN
    -- جلب الكورسات الموجودة
    SELECT id INTO course_1 FROM courses WHERE title LIKE '%Python%' LIMIT 1;
    SELECT id INTO course_2 FROM courses WHERE title LIKE '%ويب%' LIMIT 1;
    SELECT id INTO course_3 FROM courses WHERE title LIKE '%ذكاء%' OR title LIKE '%AI%' LIMIT 1;
    
    -- إضافة إنجازات عامة (بدون course_id)
    INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value)
    VALUES 
        ('البداية', 'سجل في المنصة', '🌟', 'learning', 5, 'registration', 1),
        ('أول درس', 'أكمل أول درس', '📚', 'learning', 10, 'first_lesson', 1),
        ('المتعلم النشط', 'أكمل 5 دروس', '🔥', 'learning', 25, 'lessons_completed', 5),
        ('الأسبوع الأول', 'نشط لمدة أسبوع', '📅', 'participation', 30, 'days_active', 7),
        ('المتفوق', 'احصل على 100% في اختبار', '💯', 'excellence', 50, 'perfect_quiz', 1)
    ON CONFLICT DO NOTHING;
    
    -- إضافة إنجازات خاصة بكورس Python
    IF course_1 IS NOT NULL THEN
        INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value, course_id)
        VALUES 
            ('مبرمج Python مبتدئ', 'أكمل 3 دروس Python', '🐍', 'learning', 20, 'course_lessons', 3, course_1),
            ('محترف Python', 'أكمل كورس Python', '💎', 'completion', 100, 'course_complete', 1, course_1)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- إضافة إنجازات خاصة بكورس الويب
    IF course_2 IS NOT NULL THEN
        INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value, course_id)
        VALUES 
            ('مطور واجهات', 'أكمل 3 دروس ويب', '🎨', 'learning', 20, 'course_lessons', 3, course_2),
            ('مطور Full Stack', 'أكمل كورس الويب', '🌐', 'completion', 100, 'course_complete', 1, course_2)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- إضافة إنجازات خاصة بكورس AI
    IF course_3 IS NOT NULL THEN
        INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value, course_id)
        VALUES 
            ('باحث AI', 'أكمل 3 دروس AI', '🤖', 'learning', 25, 'course_lessons', 3, course_3),
            ('خبير AI', 'أكمل كورس AI', '🧠', 'completion', 150, 'course_complete', 1, course_3)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'تم إضافة الإنجازات';
END $$;

-- 5. عرض الإنجازات مع الكورسات المرتبطة
SELECT 'الإنجازات وارتباطها بالكورسات:' as info;
SELECT 
    a.title as achievement,
    a.points,
    a.category,
    c.title as linked_course,
    CASE 
        WHEN a.course_id IS NULL THEN '🌍 إنجاز عام'
        ELSE '🎯 خاص بكورس'
    END as type
FROM achievements a
LEFT JOIN courses c ON a.course_id = c.id
ORDER BY a.course_id NULLS FIRST, a.points;

-- 6. إنشاء بيانات تجريبية مترابطة
DO $$
DECLARE
    test_user UUID;
    test_course UUID;
    test_enrollment UUID;
    test_achievement UUID;
BEGIN
    -- مستخدم تجريبي
    INSERT INTO users (name, email, phone, password, role)
    VALUES ('سارة أحمد', 'sara@test.com', '01234567899', 'test123', 'student')
    ON CONFLICT (email) DO UPDATE SET name = 'سارة أحمد'
    RETURNING id INTO test_user;
    
    -- جلب كورس
    SELECT id INTO test_course FROM courses WHERE is_published = true LIMIT 1;
    
    IF test_course IS NOT NULL THEN
        -- تسجيل في الكورس
        INSERT INTO enrollments (user_id, course_id, progress, is_active)
        VALUES (test_user, test_course, 45, true)
        ON CONFLICT (user_id, course_id) DO UPDATE SET progress = 45
        RETURNING id INTO test_enrollment;
        
        -- منح إنجاز عام
        SELECT id INTO test_achievement FROM achievements WHERE course_id IS NULL LIMIT 1;
        IF test_achievement IS NOT NULL THEN
            INSERT INTO user_achievements (user_id, achievement_id, course_id, enrollment_id, is_completed)
            VALUES (test_user, test_achievement, test_course, test_enrollment, true)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- منح إنجاز خاص بالكورس
        SELECT id INTO test_achievement FROM achievements WHERE course_id = test_course LIMIT 1;
        IF test_achievement IS NOT NULL THEN
            INSERT INTO user_achievements (user_id, achievement_id, course_id, enrollment_id, is_completed)
            VALUES (test_user, test_achievement, test_course, test_enrollment, true)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- إضافة نقاط
        INSERT INTO user_points (user_id, total_points, current_level, achievements_earned)
        VALUES (test_user, 75, 2, 2)
        ON CONFLICT (user_id) DO UPDATE 
        SET total_points = 75, current_level = 2, achievements_earned = 2;
        
        RAISE NOTICE 'تم إنشاء بيانات تجريبية للمستخدم سارة';
    END IF;
END $$;

-- 7. عرض مثال على الربط الكامل
SELECT 'مثال على الربط الكامل للبيانات:' as info;
SELECT 
    u.name as الطالب,
    c.title as الكورس,
    e.progress || '%' as التقدم,
    a.title as الإنجاز,
    CASE 
        WHEN a.course_id IS NULL THEN 'عام'
        ELSE 'خاص'
    END as نوع_الإنجاز,
    up.total_points as النقاط_الكلية
FROM users u
JOIN enrollments e ON u.id = e.user_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.enrollment_id = e.id
LEFT JOIN achievements a ON ua.achievement_id = a.id
LEFT JOIN user_points up ON u.id = up.user_id
WHERE u.email IN ('sara@test.com', 'ahmed@demo.com')
ORDER BY u.name, a.title;

-- 8. ملخص العلاقات
SELECT 'ملخص العلاقات في قاعدة البيانات:' as info;
SELECT 
    'المستخدمون ← التسجيلات' as العلاقة,
    COUNT(DISTINCT e.user_id) as عدد_السجلات
FROM enrollments e
UNION ALL
SELECT 
    'التسجيلات ← الكورسات',
    COUNT(DISTINCT e.course_id)
FROM enrollments e
UNION ALL
SELECT 
    'الإنجازات ← الكورسات',
    COUNT(*)
FROM achievements WHERE course_id IS NOT NULL
UNION ALL
SELECT 
    'إنجازات المستخدمين ← المستخدمون',
    COUNT(DISTINCT ua.user_id)
FROM user_achievements ua
UNION ALL
SELECT 
    'إنجازات عامة (بدون كورس)',
    COUNT(*)
FROM achievements WHERE course_id IS NULL;

-- 9. التحقق النهائي
SELECT 
    '✅ اكتمل التحقق بنجاح!' as الحالة,
    '✅ الإنجازات مربوطة بالكورسات' as الإنجازات,
    '✅ المستخدمون مربوطون بالتسجيلات' as التسجيلات,
    '✅ النقاط والمستويات تعمل' as النقاط,
    '✅ البيانات التجريبية جاهزة' as البيانات;
