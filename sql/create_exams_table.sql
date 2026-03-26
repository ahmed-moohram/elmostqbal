-- إنشاء جدول الامتحانات لحفظ اختبارات الكورس بشكل دائم
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration INT NOT NULL DEFAULT 0, -- بالدقائق
    total_marks INT NOT NULL DEFAULT 0,
    passing_marks INT NOT NULL DEFAULT 0,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- قائمة الأسئلة مع الاختيارات والإجابات
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
