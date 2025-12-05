-- =====================================================
-- إنشاء جدول الكتب الرقمية
-- =====================================================

-- 1. حذف الجدول القديم إن وجد
DROP TABLE IF EXISTS public.books CASCADE;

-- 2. إنشاء جدول الكتب
CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_image TEXT,
    category TEXT NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    downloads INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    is_new_release BOOLEAN DEFAULT FALSE,
    description TEXT,
    year INTEGER,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 4. سياسة للقراءة العامة
CREATE POLICY "Allow public read books" 
ON public.books 
FOR SELECT 
USING (true);

-- 5. إضافة كتب تجريبية
INSERT INTO public.books (
    title, author, cover_image, category, rating, downloads, views,
    is_premium, is_new_release, description, year, pdf_url
) VALUES 
(
    'الرياضيات للصف الثالث الثانوي',
    'د. أحمد محمد',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80',
    'رياضيات',
    4.8,
    1250,
    5420,
    FALSE,
    TRUE,
    'كتاب شامل يغطي منهج الرياضيات للصف الثالث الثانوي بأسلوب مبسط وتمارين محلولة',
    2024,
    '#'
),
(
    'الفيزياء الحديثة',
    'د. سارة أحمد',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80',
    'فيزياء',
    4.9,
    890,
    3200,
    TRUE,
    TRUE,
    'مرجع متقدم في الفيزياء الحديثة يشمل النظرية النسبية وميكانيكا الكم',
    2024,
    '#'
),
(
    'الكيمياء العضوية',
    'د. محمد علي',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&q=80',
    'كيمياء',
    4.7,
    650,
    2100,
    FALSE,
    FALSE,
    'دليل شامل للكيمياء العضوية مع شرح مفصل للتفاعلات والمركبات',
    2023,
    '#'
),
(
    'الأحياء الجزيئية',
    'د. فاطمة حسن',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80',
    'أحياء',
    4.6,
    420,
    1800,
    TRUE,
    FALSE,
    'كتاب متخصص في الأحياء الجزيئية والهندسة الوراثية',
    2023,
    '#'
),
(
    'قواعد اللغة العربية',
    'أ. خالد سعيد',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
    'لغة عربية',
    4.9,
    2100,
    8900,
    FALSE,
    TRUE,
    'مرجع شامل في قواعد اللغة العربية والنحو والصرف',
    2024,
    '#'
),
(
    'English Grammar Master',
    'John Smith',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80',
    'لغة إنجليزية',
    4.8,
    1560,
    6200,
    FALSE,
    FALSE,
    'Comprehensive guide to English grammar for advanced learners',
    2023,
    '#'
),
(
    'تاريخ مصر الحديث',
    'د. نور الدين أحمد',
    'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=400&q=80',
    'تاريخ',
    4.5,
    780,
    3400,
    FALSE,
    FALSE,
    'دراسة شاملة لتاريخ مصر من عصر محمد علي حتى العصر الحديث',
    2023,
    '#'
),
(
    'مقدمة في الفلسفة',
    'د. ليلى عبدالله',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
    'فلسفة',
    4.4,
    320,
    1200,
    TRUE,
    TRUE,
    'مدخل شامل إلى الفلسفة وتاريخها ومدارسها المختلفة',
    2024,
    '#'
),
(
    'الرياضيات التطبيقية',
    'د. حسام الدين',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
    'رياضيات',
    4.7,
    980,
    4100,
    TRUE,
    FALSE,
    'تطبيقات الرياضيات في العلوم والهندسة',
    2023,
    '#'
),
(
    'الفيزياء للمبتدئين',
    'د. أمل محمود',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
    'فيزياء',
    4.6,
    1420,
    5800,
    FALSE,
    TRUE,
    'كتاب مبسط لتعلم أساسيات الفيزياء للطلاب المبتدئين',
    2024,
    '#'
);

-- 6. إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_books_category ON public.books(category);
CREATE INDEX idx_books_premium ON public.books(is_premium);
CREATE INDEX idx_books_new ON public.books(is_new_release);

-- =====================================================
-- ✅ تم إنشاء جدول الكتب بنجاح!
-- =====================================================
