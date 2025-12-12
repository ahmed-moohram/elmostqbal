-- إضافة ربط الامتحانات بالأقسام وترتيب داخل كل قسم

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS order_index INT;

CREATE INDEX IF NOT EXISTS idx_exams_course_section_order
    ON exams(course_id, section_id, order_index);
