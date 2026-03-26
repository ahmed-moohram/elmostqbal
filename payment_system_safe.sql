-- =============================================
-- نسخة آمنة من نظام إدارة الدفع والاشتراكات
-- يمكن تشغيلها عدة مرات بدون أخطاء
-- =============================================

-- =============================================
-- 1. جدول طلبات الدفع
-- =============================================
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

-- =============================================
-- 2. جدول الاشتراكات
-- =============================================
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

-- =============================================
-- 3. جدول إشعارات الأدمن
-- =============================================
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

-- =============================================
-- 4. الفهارس (مع فحص الوجود)
-- =============================================

-- دالة للتحقق من وجود فهرس
DO $$
BEGIN
    -- فهارس طلبات الدفع
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_requests_status') THEN
        CREATE INDEX idx_payment_requests_status ON payment_requests(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_requests_student') THEN
        CREATE INDEX idx_payment_requests_student ON payment_requests(student_phone);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_requests_course') THEN
        CREATE INDEX idx_payment_requests_course ON payment_requests(course_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_requests_created') THEN
        CREATE INDEX idx_payment_requests_created ON payment_requests(created_at DESC);
    END IF;
    
    -- فهارس الاشتراكات
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_enrollments_student') THEN
        CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_enrollments_course') THEN
        CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_enrollments_active') THEN
        CREATE INDEX idx_enrollments_active ON course_enrollments(is_active);
    END IF;
    
    -- فهارس الإشعارات
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_type') THEN
        CREATE INDEX idx_notifications_type ON admin_notifications(type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_read') THEN
        CREATE INDEX idx_notifications_read ON admin_notifications(is_read);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created') THEN
        CREATE INDEX idx_notifications_created ON admin_notifications(created_at DESC);
    END IF;
END $$;

-- =============================================
-- 5. Triggers (مع فحص الوجود)
-- =============================================

-- دالة التحديث
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- التحقق من وجود Triggers وإنشاؤها إذا لم تكن موجودة
DO $$
BEGIN
    -- Trigger لجدول payment_requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_payment_requests_updated_at'
        AND tgrelid = 'payment_requests'::regclass
    ) THEN
        CREATE TRIGGER update_payment_requests_updated_at
            BEFORE UPDATE ON payment_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger لجدول course_enrollments
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_enrollments_updated_at'
        AND tgrelid = 'course_enrollments'::regclass
    ) THEN
        CREATE TRIGGER update_enrollments_updated_at
            BEFORE UPDATE ON course_enrollments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- 6. Row Level Security (RLS)
-- =============================================

-- تفعيل RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- إدارة السياسات بشكل آمن
DO $$
BEGIN
    -- سياسات payment_requests
    DROP POLICY IF EXISTS "Students can view own payment requests" ON payment_requests;
    CREATE POLICY "Students can view own payment requests"
        ON payment_requests FOR SELECT
        USING (
            auth.uid() IS NOT NULL AND (
                student_id = auth.uid() OR 
                student_phone IN (
                    SELECT phone FROM public.users WHERE id = auth.uid()
                )
            )
        );
    
    DROP POLICY IF EXISTS "Admins can manage all payment requests" ON payment_requests;
    CREATE POLICY "Admins can manage all payment requests"
        ON payment_requests FOR ALL
        USING (
            auth.uid() IN (
                SELECT id FROM public.users WHERE role = 'admin'
            )
        );
    
    -- سياسات course_enrollments
    DROP POLICY IF EXISTS "Students can view own enrollments" ON course_enrollments;
    CREATE POLICY "Students can view own enrollments"
        ON course_enrollments FOR SELECT
        USING (auth.uid() = student_id);
    
    DROP POLICY IF EXISTS "Admins can manage enrollments" ON course_enrollments;
    CREATE POLICY "Admins can manage enrollments"
        ON course_enrollments FOR ALL
        USING (
            auth.uid() IN (
                SELECT id FROM public.users WHERE role = 'admin'
            )
        );
    
    -- سياسات admin_notifications
    DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
    CREATE POLICY "Admins can view notifications"
        ON admin_notifications FOR ALL
        USING (
            auth.uid() IN (
                SELECT id FROM public.users WHERE role = 'admin'
            )
        );
END $$;

-- =============================================
-- 7. دوال مساعدة
-- =============================================

-- دالة للحصول على حالة اشتراك الطالب
CREATE OR REPLACE FUNCTION check_enrollment(
    p_student_phone VARCHAR,
    p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    is_enrolled BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM payment_requests
        WHERE student_phone = p_student_phone
        AND course_id = p_course_id
        AND status = 'approved'
    ) INTO is_enrolled;
    
    RETURN is_enrolled;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب إحصائيات الإيرادات
CREATE OR REPLACE FUNCTION get_revenue_stats()
RETURNS TABLE(
    total_requests BIGINT,
    pending_requests BIGINT,
    approved_requests BIGINT,
    rejected_requests BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_requests,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_requests,
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'approved'), 0) as total_revenue
    FROM payment_requests;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. إضافة أعمدة إذا لم تكن موجودة
-- =============================================

-- التحقق من وجود أعمدة وإضافتها إذا لزم
DO $$
BEGIN
    -- إضافة أعمدة لجدول payment_requests إذا لم تكن موجودة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_requests' 
                   AND column_name = 'student_email') THEN
        ALTER TABLE payment_requests ADD COLUMN student_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_requests' 
                   AND column_name = 'rejection_reason') THEN
        ALTER TABLE payment_requests ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- إضافة أعمدة لجدول course_enrollments إذا لم تكن موجودة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'course_enrollments' 
                   AND column_name = 'completed_lessons') THEN
        ALTER TABLE course_enrollments ADD COLUMN completed_lessons JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN others THEN
        -- تجاهل الأخطاء إذا كانت الأعمدة موجودة
        NULL;
END $$;

-- =============================================
-- 9. بيانات تجريبية (اختياري)
-- =============================================

-- يمكنك إلغاء التعليق لإضافة بيانات تجريبية
/*
INSERT INTO payment_requests (
    student_name,
    student_phone,
    course_id,
    course_name,
    course_price,
    teacher_name,
    amount_paid,
    status
) VALUES (
    'طالب تجريبي',
    '01099999999',
    gen_random_uuid(),
    'دورة تجريبية',
    299,
    'مدرس تجريبي',
    299,
    'pending'
) ON CONFLICT DO NOTHING;
*/

-- =============================================
-- رسالة النجاح
-- =============================================
DO $$
DECLARE
    payment_count INTEGER;
    enrollment_count INTEGER;
    notification_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO payment_count FROM payment_requests;
    SELECT COUNT(*) INTO enrollment_count FROM course_enrollments;
    SELECT COUNT(*) INTO notification_count FROM admin_notifications;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ تم تطبيق نظام إدارة الدفع بنجاح!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '   - طلبات الدفع: % طلب', payment_count;
    RAISE NOTICE '   - الاشتراكات: % اشتراك', enrollment_count;
    RAISE NOTICE '   - الإشعارات: % إشعار', notification_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ الجداول جاهزة: payment_requests, course_enrollments, admin_notifications';
    RAISE NOTICE '🔒 تم تفعيل RLS وسياسات الأمان';
    RAISE NOTICE '⚡ تم إنشاء الفهارس والدوال المساعدة';
    RAISE NOTICE '🔄 يمكن تشغيل هذا السكريبت عدة مرات بأمان';
    RAISE NOTICE '🚀 النظام جاهز للاستخدام!';
    RAISE NOTICE '==============================================';
END $$;
