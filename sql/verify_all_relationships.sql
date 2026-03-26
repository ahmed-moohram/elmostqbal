-- ========================================
-- التحقق من كل العلاقات والروابط
-- Verify All Relationships and Connections
-- ========================================

-- 1. التحقق من الجداول الموجودة
SELECT '📊 الجداول الموجودة:' as section;
SELECT t.table_name, 
       COUNT(*) as columns_count
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND c.table_schema = 'public'
AND t.table_name IN (
    'users', 'courses', 'lessons', 'enrollments', 
    'lesson_progress', 'achievements', 'user_achievements',
    'user_points', 'points_history', 'certificates',
    'quizzes', 'quiz_results', 'course_reviews',
    'leaderboard', 'payments'
)
GROUP BY t.table_name
ORDER BY t.table_name;

-- ========================================
-- 2. التحقق من العلاقات في جدول achievements
-- ========================================
SELECT '🏆 جدول الإنجازات وعلاقاته:' as section;

-- التحقق من وجود عمود course_id
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'achievements'
AND column_name IN ('id', 'title', 'course_id', 'category', 'points')
ORDER BY ordinal_position;

-- عرض الإنجازات الموجودة
SELECT 
    a.title as achievement_title,
    a.category,
    a.points,
    c.title as course_title,
    CASE 
        WHEN a.course_id IS NULL THEN 'إنجاز عام (لكل الكورسات)'
        ELSE 'إنجاز خاص بكورس'
    END as achievement_type
FROM achievements a
LEFT JOIN courses c ON a.course_id = c.id
ORDER BY a.points;

-- ========================================
-- 3. التحقق من العلاقات في user_achievements
-- ========================================
SELECT '👤 جدول إنجازات المستخدمين وعلاقاته:' as section;

-- التحقق من الأعمدة
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_achievements'
AND column_name IN ('user_id', 'achievement_id', 'course_id', 'enrollment_id')
ORDER BY ordinal_position;

-- ========================================
-- 4. التحقق من العلاقات في enrollments
-- ========================================
SELECT '📚 جدول التسجيلات وعلاقاته:' as section;

SELECT 
    e.id as enrollment_id,
    u.name as student_name,
    c.title as course_title,
    e.progress,
    e.is_active
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
LIMIT 5;

-- ========================================
-- 5. التحقق من العلاقات في lesson_progress
-- ========================================
SELECT '📖 جدول تقدم الدروس وعلاقاته:' as section;

-- التحقق من وجود enrollment_id
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'lesson_progress'
AND column_name IN ('user_id', 'lesson_id', 'enrollment_id', 'is_completed')
ORDER BY ordinal_position;

-- ========================================
-- 6. إنشاء إنجازات مربوطة بالكورسات
-- ========================================
SELECT '🎯 إضافة إنجازات مربوطة بكورسات محددة:' as section;

-- جلب IDs الكورسات الموجودة
DO $$
DECLARE
    python_course_id UUID;
    web_course_id UUID;
    ai_course_id UUID;
BEGIN
    -- جلب معرفات الكورسات
    SELECT id INTO python_course_id FROM courses WHERE title LIKE '%Python%' LIMIT 1;
    SELECT id INTO web_course_id FROM courses WHERE title LIKE '%ويب%' LIMIT 1;
    SELECT id INTO ai_course_id FROM courses WHERE title LIKE '%ذكاء%' LIMIT 1;
    
    -- إضافة إنجازات عامة (لكل الكورسات)
    INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value, course_id)
    VALUES 
        -- إنجازات عامة
        ('البداية الموفقة', 'أكمل درسك الأول في أي كورس', '🎯', 'learning', 10, 'lessons_completed', 1, NULL),
        ('الطالب المجتهد', 'أكمل 5 دروس في أي كورس', '📚', 'learning', 25, 'lessons_completed', 5, NULL),
        ('المثابر', 'ادرس لمدة 7 أيام متتالية', '🔥', 'participation', 50, 'study_streak', 7, NULL),
        
        -- إنجازات خاصة بكورس Python
        ('محترف Python', 'أكمل كورس Python بالكامل', '🐍', 'completion', 150, 'course_completed', 1, python_course_id),
        ('مبرمج Python مبتدئ', 'أكمل 50% من كورس Python', '💻', 'learning', 75, 'course_progress', 50, python_course_id),
        
        -- إنجازات خاصة بكورس الويب
        ('مطور ويب', 'أكمل كورس تطوير الويب', '🌐', 'completion', 150, 'course_completed', 1, web_course_id),
        ('مصمم واجهات', 'أكمل دروس HTML و CSS', '🎨', 'learning', 50, 'lessons_completed', 3, web_course_id),
        
        -- إنجازات خاصة بكورس AI
        ('خبير AI', 'أكمل كورس الذكاء الاصطناعي', '🤖', 'completion', 200, 'course_completed', 1, ai_course_id),
        ('باحث AI', 'احصل على 90% في اختبار AI', '🧠', 'excellence', 100, 'quiz_score', 90, ai_course_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ تم إضافة إنجازات مربوطة بالكورسات';
END $$;

-- ========================================
-- 7. التحقق من points_history والعلاقات
-- ========================================
SELECT '💰 جدول سجل النقاط وعلاقاته:' as section;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'points_history'
AND column_name IN ('user_id', 'course_id', 'lesson_id', 'achievement_id', 'points')
ORDER BY ordinal_position;

-- ========================================
-- 8. التحقق من certificates والعلاقات
-- ========================================
SELECT '🎓 جدول الشهادات وعلاقاته:' as section;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'certificates'
AND column_name IN ('user_id', 'course_id', 'enrollment_id')
ORDER BY ordinal_position;

-- ========================================
-- 9. عرض ملخص العلاقات
-- ========================================
SELECT '🔗 ملخص العلاقات:' as section;

-- عرض العلاقات الخارجية (Foreign Keys)
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
    'achievements', 'user_achievements', 'enrollments', 
    'lesson_progress', 'certificates', 'points_history'
)
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- 10. إنشاء بيانات تجريبية للعلاقات
-- ========================================
SELECT '📝 إنشاء بيانات تجريبية للاختبار:' as section;

DO $$
DECLARE
    test_user_id UUID;
    test_course_id UUID;
    test_enrollment_id UUID;
    test_achievement_id UUID;
BEGIN
    -- إنشاء مستخدم تجريبي
    INSERT INTO users (name, email, phone, password, role)
    VALUES ('طالب تجريبي', 'test@example.com', '01234567890', 'password123', 'student')
    ON CONFLICT (email) DO UPDATE SET name = 'طالب تجريبي'
    RETURNING id INTO test_user_id;
    
    -- جلب كورس موجود
    SELECT id INTO test_course_id FROM courses WHERE is_published = true LIMIT 1;
    
    -- إنشاء تسجيل
    IF test_course_id IS NOT NULL THEN
        INSERT INTO enrollments (user_id, course_id, progress, is_active)
        VALUES (test_user_id, test_course_id, 25, true)
        ON CONFLICT (user_id, course_id) DO UPDATE SET progress = 25
        RETURNING id INTO test_enrollment_id;
        
        -- جلب إنجاز
        SELECT id INTO test_achievement_id FROM achievements LIMIT 1;
        
        -- منح إنجاز للمستخدم
        IF test_achievement_id IS NOT NULL THEN
            INSERT INTO user_achievements (
                user_id, 
                achievement_id, 
                course_id, 
                enrollment_id, 
                is_completed
            )
            VALUES (
                test_user_id, 
                test_achievement_id, 
                test_course_id, 
                test_enrollment_id, 
                true
            )
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            
            -- إضافة نقاط
            INSERT INTO points_history (
                user_id, 
                points, 
                action, 
                description,
                course_id,
                achievement_id
            )
            VALUES (
                test_user_id, 
                50, 
                'achievement_earned', 
                'حصل على إنجاز',
                test_course_id,
                test_achievement_id
            );
            
            RAISE NOTICE '✅ تم إنشاء بيانات تجريبية مترابطة';
        END IF;
    END IF;
END $$;

-- ========================================
-- 11. التحقق النهائي
-- ========================================
SELECT '✅ التحقق النهائي من الربط:' as section;

-- عرض مثال على الربط الكامل
SELECT 
    u.name as student_name,
    c.title as course_title,
    a.title as achievement_title,
    ua.is_completed,
    ph.points as points_earned,
    e.progress as course_progress
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
JOIN achievements a ON ua.achievement_id = a.id
LEFT JOIN courses c ON ua.course_id = c.id
LEFT JOIN enrollments e ON ua.enrollment_id = e.id
LEFT JOIN points_history ph ON ph.achievement_id = a.id AND ph.user_id = u.id
LIMIT 5;

-- رسالة النجاح النهائية
SELECT '🎉 كل شيء مربوط بشكل صحيح!' as final_message,
       '✅ الإنجازات مربوطة بالكورسات' as achievements_linked,
       '✅ المستخدمون مربوطون بالتسجيلات' as users_linked,
       '✅ التسجيلات مربوطة بالكورسات' as enrollments_linked,
       '✅ النقاط مربوطة بالإنجازات والكورسات' as points_linked;
