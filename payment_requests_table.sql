-- جدول طلبات الدفع والاشتراكات
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- بيانات الطالب
    student_name VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    student_email VARCHAR(255),
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- بيانات الكورس
    course_id UUID NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_price DECIMAL(10, 2) NOT NULL,
    
    -- بيانات المدرس
    teacher_id UUID,
    teacher_name VARCHAR(255),
    teacher_phone VARCHAR(20),
    
    -- بيانات الدفع
    payment_method VARCHAR(50) DEFAULT 'vodafone_cash',
    transaction_id VARCHAR(100),
    payment_phone VARCHAR(20),
    amount_paid DECIMAL(10, 2),
    
    -- حالة الطلب
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_student ON payment_requests(student_phone);
CREATE INDEX IF NOT EXISTS idx_payment_requests_course ON payment_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created ON payment_requests(created_at DESC);

-- جدول الاشتراكات المفعلة
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL,
    payment_request_id UUID REFERENCES payment_requests(id) ON DELETE SET NULL,
    
    -- معلومات الاشتراك
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    access_type VARCHAR(20) DEFAULT 'full' CHECK (access_type IN ('full', 'limited', 'trial')),
    
    -- تفاصيل إضافية
    progress_percentage INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    completed_lessons JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للاشتراكات
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON course_enrollments(is_active);

-- جدول الإشعارات للأدمن
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
-- الطلاب يرون طلباتهم فقط
CREATE POLICY "Students can view own payment requests"
    ON payment_requests FOR SELECT
    USING (auth.uid() IS NOT NULL AND (student_id = auth.uid() OR student_phone IN (
        SELECT phone FROM public.users WHERE id = auth.uid()
    )));

-- الأدمن يرى كل شيء
CREATE POLICY "Admins can manage all payment requests"
    ON payment_requests FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
    ));

-- الطلاب يرون اشتراكاتهم
CREATE POLICY "Students can view own enrollments"
    ON course_enrollments FOR SELECT
    USING (auth.uid() = student_id);

-- الأدمن يدير الاشتراكات
CREATE POLICY "Admins can manage enrollments"
    ON course_enrollments FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
    ));
