-- =====================================================
-- إنشاء جدول الدورات في Supabase
-- =====================================================

-- 1. حذف الجدول القديم إن وجد
DROP TABLE IF EXISTS public.courses CASCADE;

-- 2. إنشاء جدول الدورات
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    instructor_name TEXT NOT NULL,
    instructor_image TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    discount_price DECIMAL(10,2),
    level TEXT DEFAULT 'مبتدئ' CHECK (level IN ('مبتدئ', 'متوسط', 'متقدم')),
    category TEXT NOT NULL,
    thumbnail TEXT,
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    students_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    slug TEXT UNIQUE,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 4. سياسة للقراءة العامة
CREATE POLICY "Allow public read courses" 
ON public.courses 
FOR SELECT 
USING (true);

-- 5. سياسة للأدمن فقط للإضافة والتعديل
CREATE POLICY "Admin can insert courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admin can update courses" 
ON public.courses 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 6. إضافة دورات تجريبية
INSERT INTO public.courses (
    title,
    short_description,
    description,
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
    slug,
    rating_count
) VALUES 
(
    'تطوير تطبيقات الويب باستخدام React و Next.js',
    'تعلم بناء تطبيقات ويب احترافية باستخدام React و Next.js',
    'دورة شاملة لتعلم تطوير تطبيقات الويب الحديثة باستخدام React و Next.js. ستتعلم من الأساسيات حتى المستوى المتقدم.',
    'أحمد محمد',
    '/instructor1.jpg',
    1500,
    999,
    'متوسط',
    'البرمجة',
    '/course1.jpg',
    4.8,
    1250,
    TRUE,
    'web-development-react-nextjs',
    375
),
(
    'أساسيات التصميم الجرافيكي',
    'احترف التصميم الجرافيكي من الصفر باستخدام Adobe Photoshop و Illustrator',
    'دورة متكاملة لتعلم أساسيات التصميم الجرافيكي والعمل على برامج Adobe المختلفة.',
    'سارة أحمد',
    '/instructor2.jpg',
    1200,
    899,
    'مبتدئ',
    'التصميم',
    '/course2.jpg',
    4.9,
    2100,
    TRUE,
    'graphic-design-basics',
    630
),
(
    'التسويق الرقمي المتقدم',
    'استراتيجيات التسويق الرقمي وإدارة الحملات الإعلانية',
    'تعلم أحدث استراتيجيات التسويق الرقمي وكيفية إدارة الحملات الإعلانية الناجحة.',
    'محمد علي',
    '/instructor3.jpg',
    2000,
    1499,
    'متقدم',
    'التسويق',
    '/course3.jpg',
    4.7,
    890,
    FALSE,
    'digital-marketing-advanced',
    267
),
(
    'البرمجة بلغة Python للمبتدئين',
    'تعلم أساسيات البرمجة بلغة Python من الصفر',
    'دورة شاملة للمبتدئين في البرمجة لتعلم لغة Python وأساسيات البرمجة.',
    'خالد سعيد',
    '/instructor4.jpg',
    800,
    599,
    'مبتدئ',
    'البرمجة',
    '/course4.jpg',
    4.9,
    3500,
    TRUE,
    'python-programming-beginners',
    1050
),
(
    'إدارة المشاريع الاحترافية',
    'احترف إدارة المشاريع والحصول على شهادة PMP',
    'دورة متقدمة في إدارة المشاريع تؤهلك للحصول على شهادة PMP العالمية.',
    'نور الدين أحمد',
    '/instructor5.jpg',
    2500,
    1999,
    'متقدم',
    'الإدارة',
    '/course5.jpg',
    4.6,
    650,
    FALSE,
    'project-management-professional',
    195
);

-- 7. إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_courses_featured ON public.courses(is_featured);
CREATE INDEX idx_courses_slug ON public.courses(slug);

-- =====================================================
-- ✅ تم إنشاء جدول الدورات بنجاح!
-- =====================================================
