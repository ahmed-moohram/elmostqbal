-- ========================================
-- إضافة الأعمدة المفقودة لجدول المستخدمين
-- Add Missing Columns to Users Table
-- ========================================

-- 1. إضافة الأعمدة الجديدة لجدول users
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS students_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS guardian_job VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. عرض الأعمدة الموجودة الآن
SELECT 'أعمدة جدول المستخدمين:' as info;
SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. إنشاء بيانات تجريبية
DO $$
DECLARE
    test_teacher_id UUID;
    test_student_id UUID;
    test_course_id UUID;
    test_enrollment_id UUID;
BEGIN
    -- إنشاء مدرس تجريبي
    INSERT INTO users (name, email, phone, password, role, specialty, rating, is_active, is_verified)
    VALUES ('د. أحمد محمد', 'teacher1@test.com', '01098765432', btoa('test123'), 'teacher', 'البرمجة', 4.8, true, true)
    ON CONFLICT (email) DO UPDATE 
    SET role = 'teacher', specialty = 'البرمجة', rating = 4.8
    RETURNING id INTO test_teacher_id;
    
    -- إنشاء مدرس آخر
    INSERT INTO users (name, email, phone, password, role, specialty, rating, is_active, is_verified)
    VALUES ('د. سارة أحمد', 'teacher2@test.com', '01198765432', btoa('test123'), 'teacher', 'الرياضيات', 4.9, true, true)
    ON CONFLICT (email) DO UPDATE 
    SET role = 'teacher', specialty = 'الرياضيات', rating = 4.9;
    
    -- إنشاء طالب تجريبي
    INSERT INTO users (name, email, phone, password, role, city, grade_level, parent_phone, is_active)
    VALUES ('محمد علي', 'student1@test.com', '01234567890', btoa('test123'), 'student', 'القاهرة', 'الصف الثالث', '01111111111', true)
    ON CONFLICT (email) DO UPDATE 
    SET role = 'student', city = 'القاهرة', grade_level = 'الصف الثالث'
    RETURNING id INTO test_student_id;
    
    -- إنشاء طالب آخر
    INSERT INTO users (name, email, phone, password, role, city, grade_level, parent_phone, is_active)
    VALUES ('فاطمة محمد', 'student2@test.com', '01234567891', btoa('test123'), 'student', 'الإسكندرية', 'الصف الثاني', '01222222222', true)
    ON CONFLICT (email) DO UPDATE 
    SET role = 'student', city = 'الإسكندرية', grade_level = 'الصف الثاني';
    
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
    
    RAISE NOTICE '✅ تم إنشاء البيانات التجريبية بنجاح';
END $$;

-- 4. عرض المدرسين
SELECT 'المدرسون في النظام:' as info;
SELECT 
    id,
    name as "الاسم",
    email as "البريد",
    phone as "الهاتف",
    specialty as "التخصص",
    rating as "التقييم",
    CASE 
        WHEN is_active THEN '✅ نشط'
        ELSE '❌ غير نشط'
    END as "الحالة"
FROM users
WHERE role = 'teacher'
ORDER BY created_at DESC;

-- 5. عرض الطلاب
SELECT 'الطلاب في النظام:' as info;
SELECT 
    id,
    name as "الاسم",
    email as "البريد",
    phone as "الهاتف",
    city as "المدينة",
    grade_level as "الصف",
    parent_phone as "هاتف ولي الأمر",
    CASE 
        WHEN is_active THEN '✅ نشط'
        ELSE '❌ غير نشط'
    END as "الحالة"
FROM users
WHERE role = 'student'
ORDER BY created_at DESC;

-- 6. عرض الكورسات
SELECT 'الكورسات في النظام:' as info;
SELECT 
    id,
    title as "العنوان",
    instructor_name as "المدرس",
    price as "السعر",
    CASE 
        WHEN is_published THEN '✅ منشور'
        ELSE '❌ غير منشور'
    END as "الحالة"
FROM courses
ORDER BY created_at DESC;

-- 7. عرض التسجيلات
SELECT 'التسجيلات في النظام:' as info;
SELECT 
    e.id,
    u.name as "الطالب",
    c.title as "الكورس",
    e.status as "الحالة",
    e.progress || '%' as "التقدم",
    e.enrolled_at::date as "تاريخ التسجيل"
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
ORDER BY e.enrolled_at DESC;

-- 8. ملخص النظام
SELECT 'ملخص النظام:' as info;
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as "المسؤولون",
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as "المدرسون",
    (SELECT COUNT(*) FROM users WHERE role = 'student') as "الطلاب",
    (SELECT COUNT(*) FROM courses) as "الكورسات",
    (SELECT COUNT(*) FROM enrollments) as "التسجيلات",
    (SELECT COUNT(*) FROM lessons) as "الدروس";

-- رسالة النجاح
SELECT 
    '✅ تم إضافة كل الأعمدة المطلوبة!' as status,
    '✅ تم إنشاء البيانات التجريبية!' as data,
    '🔧 يمكنك الآن اختبار الحذف من صفحة الأدمن' as action;
