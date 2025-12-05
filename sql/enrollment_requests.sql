-- ========================================
-- نظام طلبات التسجيل والموافقة الإدارية
-- ========================================

-- 1. جدول طلبات التسجيل
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- معلومات الدفع
    payment_method VARCHAR(50), -- 'bank_transfer', 'instapay', 'vodafone_cash', 'etisalat_cash'
    payment_amount DECIMAL(10,2),
    payment_reference VARCHAR(255), -- رقم المرجع أو رقم العملية
    payment_receipt_url TEXT, -- رابط صورة إيصال الدفع
    payment_date TIMESTAMP,
    
    -- معلومات إضافية
    student_phone VARCHAR(20),
    student_message TEXT, -- رسالة من الطالب
    
    -- حالة الطلب
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    admin_notes TEXT, -- ملاحظات الإدارة
    reviewed_by UUID REFERENCES users(id), -- المسؤول الذي راجع الطلب
    reviewed_at TIMESTAMP,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, course_id, status) -- منع الطلبات المكررة
);

-- 2. جدول سجل حالات الطلبات
CREATE TABLE IF NOT EXISTS enrollment_request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES enrollment_requests(id) ON DELETE CASCADE,
    status VARCHAR(20),
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول طرق الدفع المتاحة
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- 'bank', 'wallet', 'cash'
    account_details TEXT, -- تفاصيل الحساب
    instructions TEXT, -- تعليمات الدفع
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول الإشعارات للإدارة
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50), -- 'new_enrollment', 'payment_received', 'support_ticket'
    title VARCHAR(255),
    message TEXT,
    reference_id UUID, -- معرف الطلب أو المرجع
    reference_type VARCHAR(50), -- 'enrollment_request', 'support_ticket'
    is_read BOOLEAN DEFAULT FALSE,
    read_by UUID REFERENCES users(id),
    read_at TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- إضافة البيانات الأساسية
-- ========================================

-- إضافة طرق الدفع
INSERT INTO payment_methods (name, name_ar, type, account_details, instructions, display_order) VALUES
('Bank Transfer', 'تحويل بنكي', 'bank', 
 '{"bank": "البنك الأهلي", "account_number": "1234567890", "account_name": "منصة التعليم", "iban": "EG123456789012345678901234"}',
 'قم بالتحويل إلى الحساب المذكور وأرفق صورة الإيصال', 1),

('InstaPay', 'انستاباي', 'wallet',
 '{"phone": "01012345678", "name": "منصة التعليم"}',
 'قم بالتحويل عبر InstaPay وأرفق لقطة شاشة للعملية', 2),

('Vodafone Cash', 'فودافون كاش', 'wallet',
 '{"phone": "01012345678"}',
 'قم بالتحويل عبر فودافون كاش وأرفق رقم العملية', 3),

('Etisalat Cash', 'اتصالات كاش', 'wallet',
 '{"phone": "01112345678"}',
 'قم بالتحويل عبر اتصالات كاش وأرفق رقم العملية', 4),

('Orange Cash', 'أورانج كاش', 'wallet',
 '{"phone": "01212345678"}',
 'قم بالتحويل عبر أورانج كاش وأرفق رقم العملية', 5);

-- ========================================
-- الدوال المساعدة
-- ========================================

-- دالة لإنشاء طلب تسجيل جديد
CREATE OR REPLACE FUNCTION create_enrollment_request(
    p_user_id UUID,
    p_course_id UUID,
    p_payment_method VARCHAR,
    p_payment_amount DECIMAL,
    p_payment_reference VARCHAR,
    p_payment_receipt_url TEXT,
    p_student_phone VARCHAR DEFAULT NULL,
    p_student_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_course_title VARCHAR;
    v_user_name VARCHAR;
BEGIN
    -- التحقق من عدم وجود طلب معلق
    IF EXISTS (
        SELECT 1 FROM enrollment_requests 
        WHERE user_id = p_user_id 
        AND course_id = p_course_id 
        AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'يوجد طلب معلق بالفعل لهذه الدورة';
    END IF;
    
    -- إنشاء الطلب
    INSERT INTO enrollment_requests (
        user_id, course_id, payment_method, payment_amount,
        payment_reference, payment_receipt_url, payment_date,
        student_phone, student_message
    ) VALUES (
        p_user_id, p_course_id, p_payment_method, p_payment_amount,
        p_payment_reference, p_payment_receipt_url, CURRENT_TIMESTAMP,
        p_student_phone, p_student_message
    ) RETURNING id INTO v_request_id;
    
    -- إضافة سجل الحالة
    INSERT INTO enrollment_request_logs (request_id, status, changed_by, notes)
    VALUES (v_request_id, 'pending', p_user_id, 'تم إنشاء الطلب');
    
    -- جلب معلومات للإشعار
    SELECT title INTO v_course_title FROM courses WHERE id = p_course_id;
    SELECT name INTO v_user_name FROM users WHERE id = p_user_id;
    
    -- إنشاء إشعار للإدارة
    INSERT INTO admin_notifications (
        type, title, message, reference_id, reference_type, priority
    ) VALUES (
        'new_enrollment',
        'طلب تسجيل جديد',
        'طلب تسجيل من ' || v_user_name || ' في دورة ' || v_course_title,
        v_request_id,
        'enrollment_request',
        'high'
    );
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- دالة لموافقة الإدارة على الطلب
CREATE OR REPLACE FUNCTION approve_enrollment_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_course_id UUID;
    v_course_title VARCHAR;
BEGIN
    -- جلب معلومات الطلب
    SELECT user_id, course_id INTO v_user_id, v_course_id
    FROM enrollment_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'الطلب غير موجود أو تم معالجته بالفعل';
    END IF;
    
    -- تحديث حالة الطلب
    UPDATE enrollment_requests
    SET status = 'approved',
        admin_notes = p_admin_notes,
        reviewed_by = p_admin_id,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_request_id;
    
    -- إضافة سجل الحالة
    INSERT INTO enrollment_request_logs (request_id, status, changed_by, notes)
    VALUES (p_request_id, 'approved', p_admin_id, p_admin_notes);
    
    -- إنشاء التسجيل الفعلي
    INSERT INTO enrollments (user_id, course_id, is_active, enrolled_at)
    VALUES (v_user_id, v_course_id, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, course_id) DO UPDATE
    SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
    
    -- جلب عنوان الدورة
    SELECT title INTO v_course_title FROM courses WHERE id = v_course_id;
    
    -- إنشاء إشعار للطالب
    INSERT INTO notifications (
        user_id, title, message, type, is_read
    ) VALUES (
        v_user_id,
        'تم قبول طلب التسجيل',
        'تم قبول طلب تسجيلك في دورة ' || v_course_title || '. يمكنك البدء في الدراسة الآن.',
        'enrollment_approved',
        FALSE
    );
END;
$$ LANGUAGE plpgsql;

-- دالة لرفض الطلب
CREATE OR REPLACE FUNCTION reject_enrollment_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_rejection_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_course_id UUID;
    v_course_title VARCHAR;
BEGIN
    -- جلب معلومات الطلب
    SELECT user_id, course_id INTO v_user_id, v_course_id
    FROM enrollment_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'الطلب غير موجود أو تم معالجته بالفعل';
    END IF;
    
    -- تحديث حالة الطلب
    UPDATE enrollment_requests
    SET status = 'rejected',
        admin_notes = p_rejection_reason,
        reviewed_by = p_admin_id,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_request_id;
    
    -- إضافة سجل الحالة
    INSERT INTO enrollment_request_logs (request_id, status, changed_by, notes)
    VALUES (p_request_id, 'rejected', p_admin_id, p_rejection_reason);
    
    -- جلب عنوان الدورة
    SELECT title INTO v_course_title FROM courses WHERE id = v_course_id;
    
    -- إنشاء إشعار للطالب
    INSERT INTO notifications (
        user_id, title, message, type, is_read
    ) VALUES (
        v_user_id,
        'تم رفض طلب التسجيل',
        'تم رفض طلب تسجيلك في دورة ' || v_course_title || '. السبب: ' || p_rejection_reason,
        'enrollment_rejected',
        FALSE
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Views للعرض السهل
-- ========================================

-- عرض الطلبات المعلقة للإدارة
CREATE OR REPLACE VIEW pending_enrollment_requests AS
SELECT 
    er.*,
    u.name as student_name,
    u.email as student_email,
    u.student_phone as student_phone_from_profile,
    c.title as course_title,
    c.price as course_price,
    c.thumbnail as course_thumbnail,
    pm.name_ar as payment_method_name
FROM enrollment_requests er
JOIN users u ON er.user_id = u.id
JOIN courses c ON er.course_id = c.id
LEFT JOIN payment_methods pm ON er.payment_method = pm.name
WHERE er.status = 'pending'
ORDER BY er.created_at DESC;

-- عرض إحصائيات الطلبات
CREATE OR REPLACE VIEW enrollment_requests_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) as total_count,
    SUM(payment_amount) FILTER (WHERE status = 'approved') as total_approved_amount
FROM enrollment_requests;

-- ========================================
-- الفهارس للأداء
-- ========================================

CREATE INDEX idx_enrollment_requests_user ON enrollment_requests(user_id);
CREATE INDEX idx_enrollment_requests_course ON enrollment_requests(course_id);
CREATE INDEX idx_enrollment_requests_status ON enrollment_requests(status);
CREATE INDEX idx_enrollment_requests_created ON enrollment_requests(created_at DESC);
CREATE INDEX idx_enrollment_request_logs_request ON enrollment_request_logs(request_id);
CREATE INDEX idx_admin_notifications_read ON admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);

-- ========================================
-- تعطيل RLS مؤقتاً
-- ========================================

ALTER TABLE enrollment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_request_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications DISABLE ROW LEVEL SECURITY;

-- ========================================
-- رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إنشاء نظام طلبات التسجيل بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الجداول المنشأة:';
    RAISE NOTICE '- enrollment_requests: طلبات التسجيل';
    RAISE NOTICE '- enrollment_request_logs: سجل التغييرات';
    RAISE NOTICE '- payment_methods: طرق الدفع';
    RAISE NOTICE '- admin_notifications: إشعارات الإدارة';
    RAISE NOTICE '';
    RAISE NOTICE '💳 طرق الدفع المضافة:';
    RAISE NOTICE '- تحويل بنكي';
    RAISE NOTICE '- InstaPay';
    RAISE NOTICE '- Vodafone Cash';
    RAISE NOTICE '- Etisalat Cash';
    RAISE NOTICE '- Orange Cash';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 الدوال المتاحة:';
    RAISE NOTICE '- create_enrollment_request(): إنشاء طلب';
    RAISE NOTICE '- approve_enrollment_request(): قبول طلب';
    RAISE NOTICE '- reject_enrollment_request(): رفض طلب';
    RAISE NOTICE '========================================';
END $$;
