-- ========================================
-- اختبار وظائف الأدمن
-- Test Admin Functions
-- ========================================

-- 1. إنشاء بيانات تجريبية للاختبار
DO $$
DECLARE
    test_teacher_id UUID;
    test_student_id UUID;
    test_course_id UUID;
    test_enrollment_id UUID;
BEGIN
    -- إنشاء مدرس تجريبي
    INSERT INTO users (name, email, phone, password, role, specialty, rating)
    VALUES ('د. أحمد محمد', 'teacher1@test.com', '01098765432', btoa('test123'), 'teacher', 'البرمجة', 4.8)
    ON CONFLICT (email) DO UPDATE SET role = 'teacher'
    RETURNING id INTO test_teacher_id;
    
    -- إنشاء طالب تجريبي
    INSERT INTO users (name, email, phone, password, role)
    VALUES ('محمد علي', 'student1@test.com', '01234567890', btoa('test123'), 'student')
    ON CONFLICT (email) DO UPDATE SET role = 'student'
    RETURNING id INTO test_student_id;
    
    -- جلب كورس موجود أو إنشاء واحد
    SELECT id INTO test_course_id FROM courses WHERE is_published = true LIMIT 1;
    
    IF test_course_id IS NULL THEN
        INSERT INTO courses (title, description, instructor_id, instructor_name, price, is_published)
        VALUES ('كورس تجريبي للحذف', 'هذا كورس تجريبي يمكن حذفه', test_teacher_id, 'د. أحمد محمد', 199, true)
        RETURNING id INTO test_course_id;
    END IF;
    
    -- إنشاء تسجيل تجريبي
    INSERT INTO enrollments (user_id, course_id, status, progress)
    VALUES (test_student_id, test_course_id, 'pending', 0)
    ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'pending'
    RETURNING id INTO test_enrollment_id;
    
    RAISE NOTICE '✅ تم إنشاء البيانات التجريبية';
    RAISE NOTICE 'معرف المدرس: %', test_teacher_id;
    RAISE NOTICE 'معرف الطالب: %', test_student_id;
    RAISE NOTICE 'معرف الكورس: %', test_course_id;
    RAISE NOTICE 'معرف التسجيل: %', test_enrollment_id;
END $$;

-- 2. عرض المدرسين
SELECT 'المدرسون في النظام:' as info;
SELECT 
    id,
    name,
    email,
    phone,
    specialty,
    rating,
    is_active
FROM users
WHERE role = 'teacher'
ORDER BY created_at DESC;

-- 3. عرض الطلاب
SELECT 'الطلاب في النظام:' as info;
SELECT 
    id,
    name,
    email,
    phone,
    is_active
FROM users
WHERE role = 'student'
ORDER BY created_at DESC;

-- 4. عرض الكورسات
SELECT 'الكورسات في النظام:' as info;
SELECT 
    id,
    title,
    instructor_name,
    price,
    is_published,
    created_at
FROM courses
ORDER BY created_at DESC;

-- 5. عرض التسجيلات
SELECT 'التسجيلات في النظام:' as info;
SELECT 
    e.id,
    u.name as student_name,
    c.title as course_title,
    e.status,
    e.progress,
    e.enrolled_at
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
ORDER BY e.enrolled_at DESC;

-- 6. اختبار الحذف (تعليق للأمان)
-- لاختبار الحذف، قم بإلغاء التعليق عن الأسطر التالية:

/*
-- حذف تسجيل
DELETE FROM enrollments 
WHERE user_id = (SELECT id FROM users WHERE email = 'student1@test.com')
AND course_id = (SELECT id FROM courses WHERE title = 'كورس تجريبي للحذف');

-- حذف كورس
DELETE FROM courses 
WHERE title = 'كورس تجريبي للحذف';

-- حذف مدرس
DELETE FROM users 
WHERE email = 'teacher1@test.com';

-- حذف طالب
DELETE FROM users 
WHERE email = 'student1@test.com';
*/

-- 7. التحقق من العلاقات
SELECT 'التحقق من العلاقات:' as info;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('users', 'courses', 'enrollments', 'lessons')
ORDER BY tc.table_name;

-- 8. ملخص النظام
SELECT 'ملخص النظام:' as info;
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admins,
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
    (SELECT COUNT(*) FROM users WHERE role = 'student') as students,
    (SELECT COUNT(*) FROM courses) as courses,
    (SELECT COUNT(*) FROM enrollments) as enrollments,
    (SELECT COUNT(*) FROM lessons) as lessons;

-- رسالة النجاح
SELECT 
    '✅ كل شيء جاهز للاختبار!' as status,
    '🔧 يمكنك الآن اختبار الحذف من صفحة الأدمن' as action,
    '📊 البيانات التجريبية متاحة' as data;
