-- ========================================
-- إضافة المزيد من البيانات التجريبية
-- Add More Sample Data
-- ========================================

DO $$
DECLARE
    course_record RECORD;
    lesson_count INT := 0;
BEGIN
    -- 1. إضافة دروس لكل كورس منشور
    FOR course_record IN SELECT id, title FROM courses WHERE is_published = true LOOP
        -- تحقق من عدد الدروس الموجودة
        SELECT COUNT(*) INTO lesson_count FROM lessons WHERE course_id = course_record.id;
        
        -- إضافة دروس إضافية إذا كان العدد أقل من 5
        IF lesson_count < 5 THEN
            INSERT INTO lessons (course_id, title, description, video_url, duration_minutes, order_index, is_free, is_published)
            VALUES 
                (course_record.id, 'الدرس الثاني: المفاهيم الأساسية', 'شرح تفصيلي للمفاهيم الأساسية في ' || course_record.title, 'https://youtube.com/watch?v=lesson2', 30, lesson_count + 1, false, true),
                (course_record.id, 'الدرس الثالث: التطبيق العملي', 'تطبيق عملي على ما تعلمناه', 'https://youtube.com/watch?v=lesson3', 45, lesson_count + 2, false, true),
                (course_record.id, 'الدرس الرابع: حل المشاكل الشائعة', 'نتعلم كيفية حل المشاكل الشائعة', 'https://youtube.com/watch?v=lesson4', 35, lesson_count + 3, false, true),
                (course_record.id, 'الدرس الخامس: المشروع النهائي', 'بناء مشروع كامل باستخدام ما تعلمناه', 'https://youtube.com/watch?v=lesson5', 60, lesson_count + 4, false, true),
                (course_record.id, 'المراجعة النهائية والخلاصة', 'مراجعة شاملة لكل محتوى الكورس', 'https://youtube.com/watch?v=review', 25, lesson_count + 5, true, true);
            
            RAISE NOTICE '✅ تم إضافة 5 دروس إضافية للكورس: %', course_record.title;
        END IF;
    END LOOP;
END $$;

-- 2. إضافة إشعارات متنوعة للطلاب
INSERT INTO notifications (user_id, title, message, type, icon)
SELECT 
    u.id,
    'مرحباً بك في المنصة التعليمية! 🎓',
    'نتمنى لك رحلة تعليمية ممتعة ومفيدة. ابدأ بتصفح الكورسات المتاحة.',
    'info',
    '👋'
FROM users u
WHERE u.role = 'student'
AND NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = u.id 
    AND n.title LIKE 'مرحباً بك%'
);

-- إشعارات إضافية متنوعة
INSERT INTO notifications (user_id, title, message, type, icon)
SELECT 
    u.id,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'كورس جديد متاح! 🆕'
        WHEN 1 THEN 'تذكير: لديك درس غير مكتمل 📚'
        WHEN 2 THEN 'تهانينا! حصلت على شارة جديدة 🏆'
        WHEN 3 THEN 'عرض خاص: خصم 30% على الكورسات 💰'
        ELSE 'نصيحة اليوم: خصص 30 دقيقة يومياً للتعلم 💡'
    END,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'تم إضافة كورس Python المتقدم. سجل الآن!'
        WHEN 1 THEN 'لديك درس "التطبيق العملي" في انتظارك'
        WHEN 2 THEN 'أحسنت! لقد أكملت 5 دروس هذا الأسبوع'
        WHEN 3 THEN 'استخدم كود LEARN30 للحصول على الخصم'
        ELSE 'التعلم المستمر هو مفتاح النجاح'
    END,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'course'
        WHEN 1 THEN 'reminder'
        WHEN 2 THEN 'success'
        WHEN 3 THEN 'announcement'
        ELSE 'info'
    END,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN '📚'
        WHEN 1 THEN '⏰'
        WHEN 2 THEN '🎉'
        WHEN 3 THEN '📢'
        ELSE '💡'
    END
FROM users u
WHERE u.role = 'student'
LIMIT 10;

-- 3. إضافة كتب للمكتبة
INSERT INTO books (title, author, category, description, rating, downloads, views, is_premium, is_new_release, year)
VALUES 
    ('دليل البرمجة بلغة Python', 'د. أحمد محمد', 'البرمجة', 'كتاب شامل لتعلم Python من الصفر للاحتراف', 4.8, 1250, 5420, false, true, 2024),
    ('أساسيات قواعد البيانات SQL', 'م. سارة أحمد', 'قواعد البيانات', 'تعلم SQL خطوة بخطوة مع أمثلة عملية', 4.6, 890, 3200, false, false, 2023),
    ('تطوير تطبيقات الويب بـ React', 'د. محمد علي', 'تطوير الويب', 'دليلك الشامل لبناء تطبيقات ويب حديثة', 4.9, 2100, 8900, true, true, 2024),
    ('الذكاء الاصطناعي للمبتدئين', 'د. فاطمة حسن', 'الذكاء الاصطناعي', 'مقدمة سهلة في عالم AI و Machine Learning', 4.7, 1560, 6700, true, true, 2024),
    ('تصميم واجهات المستخدم UX/UI', 'م. ليلى أحمد', 'التصميم', 'أسس ومبادئ تصميم تجربة المستخدم', 4.5, 780, 2900, false, false, 2023),
    ('الأمن السيبراني', 'د. عمر خالد', 'أمن المعلومات', 'حماية البيانات والأنظمة من التهديدات', 4.8, 920, 4100, true, false, 2023),
    ('تطوير تطبيقات الموبايل', 'م. نور الدين', 'تطوير الموبايل', 'بناء تطبيقات Android و iOS', 4.6, 1100, 5200, false, true, 2024),
    ('علم البيانات Data Science', 'د. ياسمين محمد', 'علم البيانات', 'تحليل البيانات واستخراج المعرفة', 4.9, 1890, 7800, true, true, 2024)
ON CONFLICT DO NOTHING;

-- 4. إضافة المزيد من نتائج الاختبارات
INSERT INTO quiz_results (user_id, course_id, quiz_title, score, total_questions, passed, time_taken)
SELECT 
    u.id,
    c.id,
    'اختبار الوحدة ' || (RANDOM() * 5 + 1)::INT,
    (RANDOM() * 40 + 60)::INT, -- نتيجة بين 60-100
    100,
    (RANDOM() * 40 + 60)::INT > 70, -- ناجح إذا كانت النتيجة أكبر من 70
    (RANDOM() * 1800 + 600)::INT -- وقت بين 10-40 دقيقة
FROM users u
CROSS JOIN courses c
WHERE u.role = 'student'
AND c.is_published = true
AND NOT EXISTS (
    SELECT 1 FROM quiz_results qr 
    WHERE qr.user_id = u.id 
    AND qr.course_id = c.id
)
LIMIT 20;

-- 5. تحديث نقاط المستخدمين بناءً على نشاطهم
INSERT INTO user_points (user_id, total_points, current_level, lessons_completed, quizzes_passed, courses_completed)
SELECT 
    u.id,
    COALESCE(lp_count.count * 10, 0) + COALESCE(qr_count.count * 25, 0), -- 10 نقاط لكل درس، 25 لكل اختبار
    CASE 
        WHEN COALESCE(lp_count.count * 10, 0) + COALESCE(qr_count.count * 25, 0) < 100 THEN 1
        WHEN COALESCE(lp_count.count * 10, 0) + COALESCE(qr_count.count * 25, 0) < 250 THEN 2
        WHEN COALESCE(lp_count.count * 10, 0) + COALESCE(qr_count.count * 25, 0) < 500 THEN 3
        WHEN COALESCE(lp_count.count * 10, 0) + COALESCE(qr_count.count * 25, 0) < 1000 THEN 4
        ELSE 5
    END,
    COALESCE(lp_count.count, 0),
    COALESCE(qr_count.count, 0),
    COALESCE(courses_count.count, 0)
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM lesson_progress 
    WHERE is_completed = true 
    GROUP BY user_id
) lp_count ON u.id = lp_count.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM quiz_results 
    WHERE passed = true 
    GROUP BY user_id
) qr_count ON u.id = qr_count.user_id
LEFT JOIN (
    SELECT user_id, COUNT(DISTINCT course_id) as count 
    FROM lesson_progress 
    WHERE is_completed = true 
    GROUP BY user_id
) courses_count ON u.id = courses_count.user_id
WHERE u.role = 'student'
ON CONFLICT (user_id) DO UPDATE
SET 
    total_points = EXCLUDED.total_points,
    current_level = EXCLUDED.current_level,
    lessons_completed = EXCLUDED.lessons_completed,
    quizzes_passed = EXCLUDED.quizzes_passed,
    courses_completed = EXCLUDED.courses_completed,
    last_activity = CURRENT_TIMESTAMP;

-- 6. إضافة شهادات للطلاب المتفوقين
INSERT INTO certificates (user_id, course_id, certificate_number, grade, score, pdf_url)
SELECT 
    qr.user_id,
    qr.course_id,
    'CERT-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8),
    CASE 
        WHEN qr.score >= 95 THEN 'A+'
        WHEN qr.score >= 90 THEN 'A'
        WHEN qr.score >= 85 THEN 'B+'
        WHEN qr.score >= 80 THEN 'B'
        WHEN qr.score >= 75 THEN 'C+'
        ELSE 'C'
    END,
    qr.score,
    'https://certificates.platform.com/cert-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8) || '.pdf'
FROM quiz_results qr
WHERE qr.passed = true
AND qr.score >= 75
AND NOT EXISTS (
    SELECT 1 FROM certificates c 
    WHERE c.user_id = qr.user_id 
    AND c.course_id = qr.course_id
)
LIMIT 10;

-- 7. إضافة تقدم في الدروس
INSERT INTO lesson_progress (user_id, course_id, lesson_id, is_completed, time_spent, last_position)
SELECT 
    e.user_id,
    l.course_id,
    l.id,
    RANDOM() > 0.3, -- 70% احتمال أن يكون الدرس مكتمل
    (RANDOM() * l.duration_minutes)::INT, -- وقت عشوائي
    CASE 
        WHEN RANDOM() > 0.3 THEN l.duration_minutes * 60 -- مكتمل
        ELSE (RANDOM() * l.duration_minutes * 60)::INT -- في المنتصف
    END
FROM enrollments e
JOIN lessons l ON l.course_id = e.course_id
WHERE e.status = 'approved'
AND NOT EXISTS (
    SELECT 1 FROM lesson_progress lp 
    WHERE lp.user_id = e.user_id 
    AND lp.lesson_id = l.id
)
LIMIT 50;

-- ========================================
-- عرض الإحصائيات النهائية
-- ========================================
SELECT '📊 الإحصائيات النهائية:' as info;
SELECT 
    (SELECT COUNT(*) FROM lessons) as "إجمالي الدروس",
    (SELECT COUNT(*) FROM lesson_progress WHERE is_completed = true) as "الدروس المكتملة",
    (SELECT COUNT(*) FROM quiz_results) as "الاختبارات المنجزة",
    (SELECT COUNT(*) FROM quiz_results WHERE passed = true) as "الاختبارات الناجحة",
    (SELECT COUNT(*) FROM certificates) as "الشهادات الصادرة",
    (SELECT COUNT(*) FROM notifications) as "الإشعارات",
    (SELECT COUNT(*) FROM books) as "الكتب في المكتبة",
    (SELECT COUNT(DISTINCT user_id) FROM user_points WHERE total_points > 0) as "الطلاب النشطون";

-- عرض أفضل الطلاب
SELECT '🏆 أفضل 5 طلاب:' as info;
SELECT 
    u.name as "الاسم",
    up.total_points as "النقاط",
    up.current_level as "المستوى",
    up.lessons_completed as "الدروس المكتملة",
    up.quizzes_passed as "الاختبارات الناجحة",
    up.courses_completed as "الكورسات المكتملة"
FROM user_points up
JOIN users u ON up.user_id = u.id
ORDER BY up.total_points DESC
LIMIT 5;

-- عرض الكورسات الأكثر نشاطاً
SELECT '📚 الكورسات الأكثر نشاطاً:' as info;
SELECT 
    c.title as "الكورس",
    COUNT(DISTINCT lp.user_id) as "عدد الطلاب النشطين",
    COUNT(lp.id) as "إجمالي التقدم",
    COUNT(CASE WHEN lp.is_completed THEN 1 END) as "الدروس المكتملة",
    ROUND(AVG(lp.time_spent), 1) as "متوسط الوقت (دقيقة)"
FROM courses c
LEFT JOIN lesson_progress lp ON lp.course_id = c.id
GROUP BY c.id, c.title
ORDER BY COUNT(DISTINCT lp.user_id) DESC
LIMIT 5;

-- رسالة النجاح
SELECT 
    '🎉 تم إضافة البيانات التجريبية بنجاح!' as النتيجة,
    '✅ الدروس والتقدم جاهز' as الدروس,
    '✅ الإشعارات والكتب جاهزة' as المحتوى,
    '✅ النقاط والشهادات جاهزة' as المكافآت,
    '🚀 المنصة جاهزة للاستخدام الكامل!' as الحالة;
