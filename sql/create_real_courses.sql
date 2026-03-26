-- =====================================================
-- إنشاء جدول الدورات الحقيقي في Supabase
-- =====================================================

-- 1. حذف الجدول القديم إذا كان موجود (اختياري)
-- DROP TABLE IF EXISTS public.courses CASCADE;

-- 2. إنشاء جدول courses بالبنية الصحيحة
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    instructor TEXT,
    instructor_name TEXT,
    instructor_image TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    discount_price DECIMAL(10,2),
    level TEXT,
    category TEXT,
    thumbnail TEXT,
    video_url TEXT,
    rating DECIMAL(3,2) DEFAULT 4.5,
    students_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسة للسماح بالقراءة للجميع
DROP POLICY IF EXISTS "Allow public read access" ON public.courses;
CREATE POLICY "Allow public read access" 
ON public.courses 
FOR SELECT 
USING (is_published = true);

-- 5. إضافة دورات حقيقية
INSERT INTO public.courses (
    title,
    short_description,
    description,
    instructor,
    instructor_name,
    instructor_image,
    price,
    discount_price,
    level,
    category,
    thumbnail,
    rating,
    students_count,
    is_featured,
    is_published
) VALUES 
-- دورة 1: البرمجة
(
    'دورة تطوير تطبيقات الويب الحديثة مع React و Next.js',
    'تعلم بناء تطبيقات ويب احترافية من الصفر',
    'دورة شاملة لتعلم تطوير تطبيقات الويب الحديثة باستخدام React و Next.js. ستتعلم كيفية بناء تطبيقات سريعة وقابلة للتطوير باستخدام أحدث التقنيات.',
    'أحمد محمد',
    'أحمد محمد',
    'https://i.pravatar.cc/150?img=1',
    1500.00,
    999.00,
    'متوسط',
    'البرمجة',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    4.8,
    1250,
    TRUE,
    TRUE
),

-- دورة 2: التصميم
(
    'احتراف التصميم الجرافيكي - Photoshop و Illustrator',
    'من الصفر إلى الاحتراف في التصميم الجرافيكي',
    'دورة متكاملة لتعلم التصميم الجرافيكي باستخدام Adobe Photoshop و Illustrator. ستتعلم أساسيات التصميم وكيفية إنشاء تصاميم احترافية.',
    'سارة أحمد',
    'سارة أحمد',
    'https://i.pravatar.cc/150?img=5',
    1200.00,
    799.00,
    'مبتدئ',
    'التصميم',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80',
    4.9,
    2100,
    TRUE,
    TRUE
),

-- دورة 3: التسويق
(
    'استراتيجيات التسويق الرقمي المتقدمة',
    'احترف التسويق الرقمي وإدارة الحملات الإعلانية',
    'تعلم كيفية إنشاء وإدارة حملات تسويقية ناجحة على منصات التواصل الاجتماعي ومحركات البحث.',
    'محمد علي',
    'محمد علي',
    'https://i.pravatar.cc/150?img=3',
    2000.00,
    1499.00,
    'متقدم',
    'التسويق',
    'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c3c4?w=800&q=80',
    4.7,
    890,
    FALSE,
    TRUE
),

-- دورة 4: تطوير الموبايل
(
    'تطوير تطبيقات الموبايل بـ Flutter',
    'بناء تطبيقات Android و iOS احترافية',
    'دورة شاملة لتعلم Flutter و Dart لبناء تطبيقات موبايل عالية الأداء تعمل على Android و iOS.',
    'خالد السيد',
    'خالد السيد',
    'https://i.pravatar.cc/150?img=8',
    1800.00,
    1299.00,
    'متوسط',
    'البرمجة',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    4.6,
    750,
    TRUE,
    TRUE
),

-- دورة 5: إدارة المشاريع
(
    'إدارة المشاريع الاحترافية - PMP',
    'احصل على شهادة PMP العالمية',
    'دورة معتمدة لإدارة المشاريع وفقاً لمعايير PMI العالمية. تؤهلك للحصول على شهادة PMP.',
    'نورا حسن',
    'نورا حسن',
    'https://i.pravatar.cc/150?img=9',
    2500.00,
    1999.00,
    'متقدم',
    'الأعمال',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    4.9,
    1500,
    TRUE,
    TRUE
),

-- دورة 6: اللغة الإنجليزية
(
    'اللغة الإنجليزية للأعمال - Business English',
    'طور مهاراتك في اللغة الإنجليزية للعمل',
    'دورة متخصصة في اللغة الإنجليزية للأعمال. تعلم كيفية التواصل الفعال في بيئة العمل الدولية.',
    'جون سميث',
    'جون سميث',
    'https://i.pravatar.cc/150?img=7',
    800.00,
    599.00,
    'مبتدئ',
    'اللغات',
    'https://images.unsplash.com/photo-1543165365-07232ed12fad?w=800&q=80',
    4.5,
    3200,
    FALSE,
    TRUE
),

-- دورة 7: الذكاء الاصطناعي
(
    'الذكاء الاصطناعي وتعلم الآلة مع Python',
    'من الصفر إلى بناء نماذج AI احترافية',
    'دورة شاملة في الذكاء الاصطناعي وتعلم الآلة. ستتعلم Python و TensorFlow و PyTorch.',
    'د. أحمد الشريف',
    'د. أحمد الشريف',
    'https://i.pravatar.cc/150?img=11',
    3000.00,
    2499.00,
    'متقدم',
    'البرمجة',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    4.8,
    450,
    TRUE,
    TRUE
),

-- دورة 8: التصوير
(
    'التصوير الفوتوغرافي الاحترافي',
    'احترف التصوير وتحرير الصور',
    'تعلم أساسيات وتقنيات التصوير الفوتوغرافي الاحترافي وبرامج تحرير الصور.',
    'ليلى عبدالله',
    'ليلى عبدالله',
    'https://i.pravatar.cc/150?img=10',
    1000.00,
    749.00,
    'مبتدئ',
    'التصميم',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    4.7,
    1800,
    FALSE,
    TRUE
),

-- دورة 9: دورة مجانية
(
    'أساسيات البرمجة للمبتدئين - دورة مجانية',
    'ابدأ رحلتك في عالم البرمجة مجاناً',
    'دورة مجانية تماماً للمبتدئين. تعلم أساسيات البرمجة بلغة Python بطريقة سهلة وممتعة.',
    'فريق المنصة',
    'فريق المنصة',
    'https://i.pravatar.cc/150?img=12',
    0.00,
    0.00,
    'مبتدئ',
    'البرمجة',
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
    4.5,
    5000,
    TRUE,
    TRUE
);

-- 6. التحقق من النتائج
SELECT 
    id,
    title,
    category,
    level,
    price,
    discountPrice,
    rating,
    studentsCount,
    isFeatured,
    isPublished
FROM public.courses
ORDER BY created_at DESC;

-- 7. عرض الإحصائيات
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN isFeatured = true THEN 1 END) as featured_courses,
    COUNT(CASE WHEN price = 0 THEN 1 END) as free_courses,
    AVG(rating) as average_rating,
    SUM(studentsCount) as total_students
FROM public.courses;

-- =====================================================
-- ✅ تم! الآن لديك 9 دورات حقيقية في قاعدة البيانات
-- =====================================================
