-- ========================================
-- تابع: منصة التعليم الإلكترونية
-- الجزء الثاني: التسجيلات والمدفوعات
-- ========================================

-- ========================================
-- 6. جداول التسجيل والاشتراكات
-- ========================================

-- جدول تسجيلات الطلاب في الكورسات
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- للكورسات ذات المدة المحددة
    progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_accessed TIMESTAMP,
    completed_at TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_issued_at TIMESTAMP,
    certificate_url TEXT,
    
    -- الحالة
    is_active BOOLEAN DEFAULT TRUE,
    is_expired BOOLEAN DEFAULT FALSE,
    
    -- منع التسجيل المكرر
    UNIQUE(user_id, course_id)
);

-- جدول طلبات التسجيل (قبل الموافقة)
CREATE TABLE enrollment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    status enrollment_status DEFAULT 'pending',
    
    -- معلومات الدفع
    payment_method payment_method NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(255),
    receipt_image TEXT NOT NULL,
    phone_number VARCHAR(20),
    account_number VARCHAR(100),
    
    -- معلومات الطالب وقت التقديم
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    student_phone VARCHAR(20) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    
    -- المراجعة الإدارية
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    approval_message TEXT,
    rejection_reason TEXT,
    
    -- التواريخ
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع الطلبات المكررة المعلقة
    UNIQUE(student_id, course_id, status)
);

-- جدول تقدم الطالب في الدروس
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    watched_duration INT DEFAULT 0, -- بالثواني
    total_duration INT NOT NULL, -- بالثواني
    progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    last_position INT DEFAULT 0, -- آخر موضع مشاهدة بالثواني
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع التكرار
    UNIQUE(user_id, lesson_id)
);

-- ========================================
-- 7. جداول المدفوعات والفواتير
-- ========================================

-- جدول المدفوعات
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response JSONB, -- لحفظ استجابة بوابة الدفع
    
    -- معلومات إضافية
    description TEXT,
    invoice_number VARCHAR(50) UNIQUE,
    receipt_url TEXT,
    
    -- التواريخ
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفواتير
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    user_id UUID NOT NULL REFERENCES users(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- التفاصيل المالية
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- معلومات العميل
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    
    -- الحالة
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    
    -- الملفات
    pdf_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول بنود الفاتورة
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الكوبونات والخصومات
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    
    -- القيود
    usage_limit INT,
    usage_count INT DEFAULT 0,
    user_limit INT DEFAULT 1, -- عدد المرات لكل مستخدم
    
    -- النطاق
    is_global BOOLEAN DEFAULT FALSE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- الصلاحية
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- التحقق من نوع الخصم
    CONSTRAINT check_discount_value CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        (discount_type = 'fixed')
    )
);

-- جدول استخدام الكوبونات
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    payment_id UUID REFERENCES payments(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع الاستخدام المتكرر
    UNIQUE(coupon_id, user_id, payment_id)
);

-- جدول خطط الاشتراك
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    duration_days INT NOT NULL,
    
    -- المميزات
    features JSONB,
    max_courses INT,
    has_certificate BOOLEAN DEFAULT TRUE,
    has_support BOOLEAN DEFAULT TRUE,
    
    -- الحالة
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول اشتراكات المستخدمين
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    payment_id UUID REFERENCES payments(id),
    
    -- الفترة
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP NOT NULL,
    
    -- الحالة
    is_active BOOLEAN DEFAULT TRUE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- التجديد التلقائي
    auto_renew BOOLEAN DEFAULT TRUE,
    next_billing_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 8. جداول التقييمات والمراجعات
-- ========================================

-- جدول تقييمات الكورسات
CREATE TABLE course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- التفاعل
    likes_count INT DEFAULT 0,
    dislikes_count INT DEFAULT 0,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    
    -- رد المدرس
    instructor_response TEXT,
    instructor_response_date TIMESTAMP,
    
    -- الحالة
    is_published BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع التقييم المكرر
    UNIQUE(course_id, user_id)
);

-- جدول التفاعل مع التقييمات
CREATE TABLE review_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES course_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع التفاعل المكرر
    UNIQUE(review_id, user_id)
);

-- جدول تقييمات المدرسين
CREATE TABLE teacher_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    student_id UUID NOT NULL REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- الجوانب المختلفة للتقييم
    teaching_quality INT CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
    communication INT CHECK (communication >= 1 AND communication <= 5),
    course_content INT CHECK (course_content >= 1 AND course_content <= 5),
    support_quality INT CHECK (support_quality >= 1 AND support_quality <= 5),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع التقييم المكرر للمدرس في نفس الكورس
    UNIQUE(teacher_id, student_id, course_id)
);

-- ========================================
-- يتبع في الملف التالي...
-- ========================================
