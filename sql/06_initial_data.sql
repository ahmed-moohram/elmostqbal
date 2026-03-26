-- ========================================
-- منصة التعليم الإلكترونية
-- البيانات الأولية والإعدادات
-- ========================================

-- ========================================
-- 1. إنشاء المستخدم الأدمن الأساسي
-- ========================================

-- إنشاء حساب الأدمن
INSERT INTO users (
    id,
    name,
    father_name,
    student_phone,
    parent_phone,
    email,
    password_hash,
    role,
    status,
    is_verified,
    city,
    created_at
) VALUES (
    gen_random_uuid(),
    'مدير النظام',
    'أحمد',
    '01234567890',
    '01234567890',
    'admin@platform.com',
    crypt('Admin@2024', gen_salt('bf')), -- كلمة المرور: Admin@2024
    'admin',
    'active',
    TRUE,
    'القاهرة',
    CURRENT_TIMESTAMP
);

-- ========================================
-- 2. إنشاء خطط الاشتراك الأساسية
-- ========================================

INSERT INTO subscription_plans (name, description, price, currency, duration_days, features, max_courses, has_certificate, has_support, is_active) VALUES
('الخطة المجانية', 'خطة مجانية للتجربة', 0, 'EGP', 30, 
    '{"features": ["الوصول لكورس واحد", "مشاهدة الدروس", "التواصل مع المدرس"]}', 
    1, FALSE, FALSE, TRUE),

('الخطة الأساسية', 'خطة شهرية للطلاب', 199, 'EGP', 30,
    '{"features": ["الوصول لـ 3 كورسات", "تحميل المواد", "الواجبات والاختبارات", "الدعم الفني"]}',
    3, TRUE, TRUE, TRUE),

('الخطة المتقدمة', 'خطة فصلية للطلاب المتميزين', 499, 'EGP', 90,
    '{"features": ["الوصول لـ 10 كورسات", "جلسات مباشرة", "شهادات معتمدة", "أولوية الدعم", "مواد حصرية"]}',
    10, TRUE, TRUE, TRUE),

('الخطة الاحترافية', 'خطة سنوية شاملة', 1999, 'EGP', 365,
    '{"features": ["وصول غير محدود", "جميع المميزات", "جلسات خاصة", "متابعة شخصية", "خصومات على الكورسات الجديدة"]}',
    NULL, TRUE, TRUE, TRUE);

-- ========================================
-- 3. إنشاء الإنجازات الأساسية
-- ========================================

INSERT INTO achievements (name, description, icon_url, badge_url, criteria, points, category, level, is_active) VALUES
('البداية الموفقة', 'أكمل أول درس لك', '/badges/first-lesson.png', '/badges/first-lesson-badge.png',
    '{"type": "lesson_completion", "count": 1}', 10, 'learning', 'bronze', TRUE),

('الطالب المجتهد', 'أكمل 10 دروس', '/badges/10-lessons.png', '/badges/10-lessons-badge.png',
    '{"type": "lesson_completion", "count": 10}', 50, 'learning', 'silver', TRUE),

('المتعلم النشط', 'احضر 5 جلسات مباشرة', '/badges/live-sessions.png', '/badges/live-sessions-badge.png',
    '{"type": "live_session_attendance", "count": 5}', 100, 'participation', 'gold', TRUE),

('الطالب المتميز', 'احصل على 90% أو أكثر في 5 اختبارات', '/badges/top-student.png', '/badges/top-student-badge.png',
    '{"type": "quiz_excellence", "count": 5, "min_score": 90}', 200, 'excellence', 'platinum', TRUE),

('المشارك الفعال', 'اطرح 10 أسئلة في المنتدى', '/badges/active-participant.png', '/badges/active-participant-badge.png',
    '{"type": "questions_asked", "count": 10}', 30, 'participation', 'bronze', TRUE),

('المساعد المتميز', 'أجب على 20 سؤال', '/badges/helper.png', '/badges/helper-badge.png',
    '{"type": "answers_given", "count": 20}', 75, 'helping', 'silver', TRUE),

('إنجاز الكورس الأول', 'أكمل كورسك الأول بنجاح', '/badges/first-course.png', '/badges/first-course-badge.png',
    '{"type": "course_completion", "count": 1}', 150, 'completion', 'gold', TRUE),

('محترف التعلم', 'أكمل 5 كورسات', '/badges/pro-learner.png', '/badges/pro-learner-badge.png',
    '{"type": "course_completion", "count": 5}', 500, 'completion', 'platinum', TRUE);

-- ========================================
-- 4. إنشاء قوالب الإشعارات
-- ========================================

-- إنشاء جدول قوالب الإشعارات (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) UNIQUE NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    variables TEXT[], -- المتغيرات المتوقعة في القالب
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notification_templates (type, title_template, message_template, variables, is_active) VALUES
('enrollment_approved', 'تم قبول طلب التسجيل', 'مبروك! تم قبول طلبك للتسجيل في كورس {course_name}', ARRAY['course_name'], TRUE),
('enrollment_rejected', 'تم رفض طلب التسجيل', 'نأسف، تم رفض طلبك للتسجيل في كورس {course_name}. السبب: {reason}', ARRAY['course_name', 'reason'], TRUE),
('new_assignment', 'واجب جديد', 'تم إضافة واجب جديد "{assignment_title}" في كورس {course_name}', ARRAY['assignment_title', 'course_name'], TRUE),
('assignment_graded', 'تم تقييم الواجب', 'تم تقييم واجبك "{assignment_title}" - الدرجة: {score}/{max_score}', ARRAY['assignment_title', 'score', 'max_score'], TRUE),
('live_session_reminder', 'تذكير بجلسة مباشرة', 'جلسة مباشرة "{session_title}" ستبدأ بعد {time_remaining}', ARRAY['session_title', 'time_remaining'], TRUE),
('course_update', 'تحديث في الكورس', 'تم تحديث كورس {course_name}: {update_description}', ARRAY['course_name', 'update_description'], TRUE),
('certificate_issued', 'شهادة جديدة', 'مبروك! تم إصدار شهادة إتمام كورس {course_name}', ARRAY['course_name'], TRUE),
('payment_confirmed', 'تأكيد الدفع', 'تم تأكيد دفعتك بقيمة {amount} {currency} بنجاح', ARRAY['amount', 'currency'], TRUE),
('question_answered', 'إجابة على سؤالك', 'تم الرد على سؤالك "{question_title}" في كورس {course_name}', ARRAY['question_title', 'course_name'], TRUE),
('achievement_earned', 'إنجاز جديد', 'مبروك! حصلت على إنجاز "{achievement_name}"', ARRAY['achievement_name'], TRUE);

-- ========================================
-- 5. إنشاء الإعدادات العامة للمنصة
-- ========================================

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

INSERT INTO platform_settings (key, value, description) VALUES
('platform_name', '"منصة التعليم الإلكترونية"', 'اسم المنصة'),
('platform_logo', '"/logo.png"', 'شعار المنصة'),
('platform_email', '"info@platform.com"', 'البريد الإلكتروني الرسمي'),
('platform_phone', '"01234567890"', 'رقم الهاتف الرسمي'),
('platform_address', '"القاهرة، مصر"', 'عنوان المنصة'),
('social_media', '{"facebook": "https://facebook.com/platform", "twitter": "https://twitter.com/platform", "youtube": "https://youtube.com/platform"}', 'روابط التواصل الاجتماعي'),
('payment_methods', '["vodafone_cash", "bank_transfer", "instapay", "credit_card"]', 'طرق الدفع المتاحة'),
('vodafone_cash_number', '"01234567890"', 'رقم فودافون كاش'),
('bank_account', '{"bank_name": "البنك الأهلي", "account_number": "1234567890", "account_name": "منصة التعليم"}', 'معلومات الحساب البنكي'),
('instapay_info', '{"username": "@platform_pay", "qr_code": "/payment/instapay-qr.png"}', 'معلومات InstaPay'),
('maintenance_mode', 'false', 'وضع الصيانة'),
('registration_enabled', 'true', 'السماح بالتسجيل الجديد'),
('max_devices_per_user', '3', 'الحد الأقصى للأجهزة لكل مستخدم'),
('session_timeout', '7200', 'مدة الجلسة بالثواني'),
('video_watermark', 'true', 'إضافة علامة مائية على الفيديوهات'),
('download_enabled', 'true', 'السماح بتحميل المواد'),
('trial_period_days', '7', 'مدة الفترة التجريبية بالأيام'),
('commission_percentage', '20', 'نسبة عمولة المنصة من المدرسين'),
('currency', '"EGP"', 'العملة الافتراضية'),
('timezone', '"Africa/Cairo"', 'المنطقة الزمنية');

-- ========================================
-- 6. إنشاء الكوبونات الترويجية الأولية
-- ========================================

INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, usage_limit, user_limit, is_global, valid_from, valid_until, is_active) VALUES
('WELCOME2024', 'خصم ترحيبي للمستخدمين الجدد', 'percentage', 20, 100, 100, 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', TRUE),
('STUDENT50', 'خصم 50% للطلاب', 'percentage', 50, 200, 50, 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', TRUE),
('EARLYBIRD', 'خصم الحجز المبكر', 'fixed', 100, 500, NULL, 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', TRUE);

-- ========================================
-- 7. إنشاء الفئات الأساسية للكورسات
-- ========================================

CREATE TABLE IF NOT EXISTS course_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    parent_id UUID REFERENCES course_categories(id),
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO course_categories (name, slug, description, icon, order_index) VALUES
('الرياضيات', 'mathematics', 'كورسات الرياضيات لجميع المراحل', 'calculator', 1),
('العلوم', 'science', 'كورسات الفيزياء والكيمياء والأحياء', 'flask', 2),
('اللغة العربية', 'arabic', 'كورسات اللغة العربية والنحو والأدب', 'book', 3),
('اللغة الإنجليزية', 'english', 'كورسات اللغة الإنجليزية والقواعد', 'language', 4),
('الدراسات الاجتماعية', 'social-studies', 'كورسات التاريخ والجغرافيا', 'globe', 5),
('الحاسب الآلي', 'computer', 'كورسات البرمجة والحاسب الآلي', 'computer', 6),
('المهارات الحياتية', 'life-skills', 'كورسات تطوير الذات والمهارات', 'star', 7);

-- إضافة الفئات الفرعية
INSERT INTO course_categories (name, slug, description, parent_id, order_index) VALUES
('الجبر', 'algebra', 'كورسات الجبر والمعادلات', (SELECT id FROM course_categories WHERE slug = 'mathematics'), 1),
('الهندسة', 'geometry', 'كورسات الهندسة الفراغية والمستوية', (SELECT id FROM course_categories WHERE slug = 'mathematics'), 2),
('التفاضل والتكامل', 'calculus', 'كورسات التفاضل والتكامل', (SELECT id FROM course_categories WHERE slug = 'mathematics'), 3),
('الفيزياء', 'physics', 'كورسات الفيزياء', (SELECT id FROM course_categories WHERE slug = 'science'), 1),
('الكيمياء', 'chemistry', 'كورسات الكيمياء', (SELECT id FROM course_categories WHERE slug = 'science'), 2),
('الأحياء', 'biology', 'كورسات الأحياء', (SELECT id FROM course_categories WHERE slug = 'science'), 3);

-- ========================================
-- 8. إنشاء البيانات التجريبية (اختياري)
-- ========================================

-- يمكن إلغاء التعليق عن الأسطر التالية لإضافة بيانات تجريبية

/*
-- إنشاء مدرس تجريبي
INSERT INTO users (
    id, name, father_name, student_phone, parent_phone, email,
    password_hash, role, status, is_verified, specialty, city
) VALUES (
    gen_random_uuid(),
    'أحمد محمد',
    'محمد',
    '01111111111',
    '01111111111',
    'teacher@platform.com',
    crypt('Teacher@2024', gen_salt('bf')),
    'teacher',
    'active',
    TRUE,
    'مدرس رياضيات',
    'القاهرة'
);

-- إضافة معلومات المدرس
INSERT INTO teachers (
    user_id, bio, specialization, experience_years
) VALUES (
    (SELECT id FROM users WHERE email = 'teacher@platform.com'),
    'مدرس رياضيات خبرة 10 سنوات في التدريس للثانوية العامة',
    'رياضيات',
    10
);

-- إنشاء طالب تجريبي
INSERT INTO users (
    id, name, father_name, student_phone, parent_phone, email,
    password_hash, role, status, is_verified, grade_level, city
) VALUES (
    gen_random_uuid(),
    'محمد أحمد',
    'أحمد',
    '01222222222',
    '01333333333',
    'student@platform.com',
    crypt('Student@2024', gen_salt('bf')),
    'student',
    'active',
    TRUE,
    'الصف الثالث الثانوي',
    'السويس'
);

-- إضافة معلومات الطالب
INSERT INTO students (
    user_id, student_code, academic_year
) VALUES (
    (SELECT id FROM users WHERE email = 'student@platform.com'),
    'STD2024001',
    '2024-2025'
);
*/

-- ========================================
-- النهاية
-- ========================================
