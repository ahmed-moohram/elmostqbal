-- إصلاح جدول الامتحانات الحالي بإضافة الأعمدة الناقصة بدون حذف أي بيانات

-- ملاحظة: هذا السكربت يفترض أن جدول exams موجود بالفعل،
-- لذلك نستخدم ALTER TABLE مع ADD COLUMN IF NOT EXISTS

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS duration INT NOT NULL DEFAULT 0, -- مدة الامتحان بالدقائق
    ADD COLUMN IF NOT EXISTS total_marks INT NOT NULL DEFAULT 0, -- مجموع درجات الامتحان
    ADD COLUMN IF NOT EXISTS passing_marks INT NOT NULL DEFAULT 0, -- درجة النجاح
    ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- قائمة الأسئلة
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
