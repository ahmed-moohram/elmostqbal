-- =====================================================
-- نظام الكتب المدفوعة في المكتبة (library_books)
-- =====================================================

-- توسيع جدول library_books (إن وُجد) ليحتوي على معلومات الدفع والمدرّس
ALTER TABLE IF EXISTS public.library_books
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS teacher_phone VARCHAR(20);

-- جدول طلبات شراء الكتب
CREATE TABLE IF NOT EXISTS public.library_book_purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  student_name VARCHAR(255) NOT NULL,
  student_phone VARCHAR(20) NOT NULL,
  teacher_phone VARCHAR(20),

  price NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الكتب المملوكة للطالب (الكتب المشتراة)
CREATE TABLE IF NOT EXISTS public.user_library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  purchase_request_id UUID REFERENCES public.library_book_purchase_requests(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_library_book_requests_book ON public.library_book_purchase_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_library_book_requests_teacher ON public.library_book_purchase_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_library_book_requests_student ON public.library_book_purchase_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_user_library_books_user ON public.user_library_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_books_book ON public.user_library_books(book_id);

-- تفعيل RLS (يمكن ضبط السياسات لاحقاً في ملف الأمان الرئيسي)
ALTER TABLE public.library_book_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own book purchase requests"
  ON public.library_book_purchase_requests
  FOR SELECT
  USING (auth.uid() = student_id);

-- المدرّسون يرون طلبات شراء الكتب التي تخص كتبهم
CREATE POLICY "Teachers can view own book purchase requests"
  ON public.library_book_purchase_requests
  FOR SELECT
  USING (auth.uid() = teacher_id);

-- الطلاب يرون كتبهم المملوكة
CREATE POLICY "Students can view own library books"
  ON public.user_library_books
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_library_book_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_library_book_request_updated_at
  ON public.library_book_purchase_requests;

CREATE TRIGGER trg_update_library_book_request_updated_at
  BEFORE UPDATE ON public.library_book_purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_library_book_request_updated_at();

-- =====================================================
-- ✅ تم إعداد بنية نظام الكتب المدفوعة (مكتبة الكتب)
-- =====================================================
