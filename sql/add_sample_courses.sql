-- =====================================================
-- إضافة دورات تجريبية للمنصة
-- =====================================================

-- 1. التأكد من وجود جدول courses
-- =====================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructor TEXT,
    instructor_id UUID,
    price DECIMAL(10,2) DEFAULT 0,
    discount_price DECIMAL(10,2),
    duration TEXT,
    level TEXT,
    category TEXT,
    thumbnail TEXT,
    video_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    students_count INTEGER DEFAULT 0,
    lessons_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'العربية',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إضافة أعمدة إضافية إذا لم تكن موجودة
-- =====================================================

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS discountPrice DECIMAL(10,2);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS studentsCount INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lessonsCount INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS isFeatured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS isPublished BOOLEAN DEFAULT TRUE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS isFree BOOLEAN DEFAULT FALSE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lastUpdated TIMESTAMPTZ DEFAULT NOW();

-- 3. حذف الدورات القديمة (اختياري)
-- =====================================================

-- DELETE FROM public.courses;

-- 4. إضافة دورات تجريبية
-- =====================================================

INSERT INTO public.courses (
    title,
    description,
    instructor,
    price,
    discount_price,
    discountPrice,
    duration,
    level,
    category,
    thumbnail,
    rating,
    students_count,
    studentsCount,
    lessons_count,
    lessonsCount,
    language,
    is_featured,
    isFeatured,
    is_published,
    isPublished,
    is_free,
    isFree
) VALUES 
(
    'دورة تطوير تطبيقات الويب الحديثة',
    'تعلم بناء تطبيقات ويب احترافية باستخدام React و Next.js. ستتعلم في هذه الدورة كيفية بناء تطبيقات ويب حديثة وسريعة باستخدام أحدث التقنيات.',
    'أحمد محمد',
    1500,
    999,
    999,
    '40 ساعة',
    'متوسط',
    'البرمجة',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    4.8,
    1250,
    1250,
    85,
    85,
    'العربية',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'أساسيات التصميم الجرافيكي',
    'احترف التصميم الجرافيكي من الصفر باستخدام Adobe Photoshop و Illustrator. دورة شاملة للمبتدئين في عالم التصميم.',
    'سارة أحمد',
    1200,
    799,
    799,
    '30 ساعة',
    'مبتدئ',
    'التصميم',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800',
    4.9,
    2100,
    2100,
    65,
    65,
    'العربية',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'التسويق الرقمي المتقدم',
    'استراتيجيات التسويق الرقمي وإدارة الحملات الإعلانية. تعلم كيفية إنشاء وإدارة حملات تسويقية ناجحة على منصات التواصل الاجتماعي.',
    'محمد علي',
    2000,
    1499,
    1499,
    '25 ساعة',
    'متقدم',
    'التسويق',
    'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c3c4?w=800',
    4.7,
    890,
    890,
    45,
    45,
    'العربية',
    FALSE,
    FALSE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'تطوير تطبيقات الموبايل بـ Flutter',
    'تعلم بناء تطبيقات موبايل احترافية لنظامي Android و iOS باستخدام Flutter و Dart.',
    'خالد السيد',
    1800,
    1299,
    1299,
    '35 ساعة',
    'متوسط',
    'البرمجة',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    4.6,
    750,
    750,
    72,
    72,
    'العربية',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'إدارة المشاريع الاحترافية',
    'تعلم أساسيات إدارة المشاريع وحصل على شهادة PMP. دورة شاملة في إدارة المشاريع بالمعايير العالمية.',
    'نورا حسن',
    2500,
    1999,
    1999,
    '45 ساعة',
    'متقدم',
    'الأعمال',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    4.9,
    1500,
    1500,
    90,
    90,
    'العربية',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'اللغة الإنجليزية للأعمال',
    'طور مهاراتك في اللغة الإنجليزية للتواصل الفعال في بيئة العمل.',
    'جون سميث',
    800,
    599,
    599,
    '20 ساعة',
    'مبتدئ',
    'اللغات',
    'https://images.unsplash.com/photo-1543165365-07232ed12fad?w=800',
    4.5,
    3200,
    3200,
    40,
    40,
    'العربية والإنجليزية',
    FALSE,
    FALSE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'الذكاء الاصطناعي وتعلم الآلة',
    'مقدمة شاملة في الذكاء الاصطناعي وتعلم الآلة باستخدام Python.',
    'د. أحمد الشريف',
    3000,
    2499,
    2499,
    '50 ساعة',
    'متقدم',
    'البرمجة',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    4.8,
    450,
    450,
    100,
    100,
    'العربية',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'التصوير الفوتوغرافي الاحترافي',
    'تعلم أساسيات وتقنيات التصوير الفوتوغرافي الاحترافي.',
    'ليلى عبدالله',
    1000,
    749,
    749,
    '15 ساعة',
    'مبتدئ',
    'التصميم',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
    4.7,
    1800,
    1800,
    30,
    30,
    'العربية',
    FALSE,
    FALSE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
),
(
    'دورة مجانية: أساسيات البرمجة',
    'تعلم أساسيات البرمجة مجاناً. مقدمة للمبتدئين في عالم البرمجة.',
    'فريق المنصة',
    0,
    0,
    0,
    '10 ساعات',
    'مبتدئ',
    'البرمجة',
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
    4.5,
    5000,
    5000,
    20,
    20,
    'العربية',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
);

-- 5. عرض الدورات المضافة
-- =====================================================

SELECT 
    id,
    title,
    instructor,
    category,
    level,
    price,
    discount_price,
    is_published,
    is_featured,
    is_free
FROM public.courses
ORDER BY created_at DESC;

-- 6. رسالة النجاح
-- =====================================================

DO $$
DECLARE
    course_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO course_count FROM public.courses;
    
    RAISE NOTICE '✓ تم إضافة الدورات بنجاح!';
    RAISE NOTICE '  عدد الدورات الكلي: %', course_count;
    RAISE NOTICE '  يمكنك الآن عرض الدورات في الموقع';
END $$;

-- =====================================================
-- ملاحظة: الدورات ستظهر في صفحة /courses
-- =====================================================
