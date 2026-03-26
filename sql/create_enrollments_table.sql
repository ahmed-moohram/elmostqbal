-- =====================================================
-- إنشاء جدول التسجيلات والإنجازات
-- =====================================================

-- 1. جدول التسجيلات (enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_lessons INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, course_id)
);

-- 2. جدول الإنجازات (achievements)
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الشهادات (certificates)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    certificate_url TEXT,
    grade TEXT
);

-- 4. تفعيل RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 5. سياسات الأمان - السماح للمستخدمين بقراءة بياناتهم
CREATE POLICY "Users can read own enrollments" 
ON public.enrollments FOR SELECT 
USING (true); -- مؤقتاً للجميع

CREATE POLICY "Users can read own achievements" 
ON public.achievements FOR SELECT 
USING (true);

CREATE POLICY "Users can read own certificates" 
ON public.certificates FOR SELECT 
USING (true);

-- 6. السماح بالإدراج للجميع (مؤقتاً)
CREATE POLICY "Allow insert enrollments" 
ON public.enrollments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow insert achievements" 
ON public.achievements FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow insert certificates" 
ON public.certificates FOR INSERT 
WITH CHECK (true);

-- 7. إضافة بيانات تجريبية
-- تسجيلات تجريبية (استبدل USER_ID بـ ID حقيقي)
/*
INSERT INTO public.enrollments (user_id, course_id, progress, completed_lessons)
SELECT 
    (SELECT id FROM public.users LIMIT 1),
    id,
    CASE 
        WHEN random() < 0.3 THEN 100
        WHEN random() < 0.6 THEN round((random() * 80 + 20)::numeric, 2)
        ELSE round((random() * 50)::numeric, 2)
    END,
    CASE 
        WHEN random() < 0.3 THEN 10
        ELSE floor(random() * 10)::integer
    END
FROM public.courses
LIMIT 3;
*/

-- =====================================================
-- ✅ تم إنشاء جداول Dashboard بنجاح!
-- =====================================================
