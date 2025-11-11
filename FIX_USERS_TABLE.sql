-- =============================================
-- إصلاح جدول المستخدمين
-- =============================================

-- 1️⃣ التحقق من وجود العمود password_hash وإضافته إن لم يكن موجوداً
DO $$
BEGIN
    -- التحقق من وجود العمود password_hash
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        -- إذا كان هناك عمود password قديم، نعيد تسميته
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'password'
        ) THEN
            ALTER TABLE users RENAME COLUMN password TO password_hash;
            RAISE NOTICE '✅ تم تغيير اسم العمود من password إلى password_hash';
        ELSE
            -- إذا لم يكن هناك أي عمود للباسورد، نضيفه
            ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
            RAISE NOTICE '✅ تم إضافة العمود password_hash';
        END IF;
    ELSE
        RAISE NOTICE '✅ العمود password_hash موجود بالفعل';
    END IF;
END $$;

-- 2️⃣ إضافة الأعمدة الإضافية إن لم تكن موجودة
DO $$
BEGIN
    -- إضافة معلومات العائلة للطلاب
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'father_name') THEN
        ALTER TABLE users ADD COLUMN father_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'student_phone') THEN
        ALTER TABLE users ADD COLUMN student_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'parent_phone') THEN
        ALTER TABLE users ADD COLUMN parent_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mother_phone') THEN
        ALTER TABLE users ADD COLUMN mother_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'guardian_job') THEN
        ALTER TABLE users ADD COLUMN guardian_job VARCHAR(255);
    END IF;
    
    -- إضافة معلومات التعليم
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'school_name') THEN
        ALTER TABLE users ADD COLUMN school_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'grade_level') THEN
        ALTER TABLE users ADD COLUMN grade_level VARCHAR(100);
    END IF;
    
    -- إضافة معلومات الموقع
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT 'مصر';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
        ALTER TABLE users ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;
    
    -- إضافة avatar_url إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- إضافة bio إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;
    
    -- إضافة birth_date إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birth_date') THEN
        ALTER TABLE users ADD COLUMN birth_date DATE;
    END IF;
    
    -- إضافة gender إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other'));
    END IF;
    
    -- إضافة is_verified إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- إضافة is_active إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- إضافة registration_source إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'registration_source') THEN
        ALTER TABLE users ADD COLUMN registration_source VARCHAR(50) DEFAULT 'website';
    END IF;
    
    -- إضافة referral_code إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(50);
    END IF;
    
    -- إضافة referred_by إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referred_by') THEN
        ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- إضافة الإحصائيات
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'courses_enrolled') THEN
        ALTER TABLE users ADD COLUMN courses_enrolled INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'courses_completed') THEN
        ALTER TABLE users ADD COLUMN courses_completed INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_spent') THEN
        ALTER TABLE users ADD COLUMN total_spent DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- إضافة التواريخ
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
    
    RAISE NOTICE '✅ تم تحديث جدول المستخدمين بنجاح';
END $$;

-- 3️⃣ عرض بنية الجدول الحالية
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 4️⃣ الآن يمكنك إضافة المستخدم الأدمن
INSERT INTO users (
    name, 
    email, 
    phone,
    password_hash,
    role,
    is_verified,
    is_active
) VALUES (
    'مدير النظام',
    'admin@platform.edu',
    '01000000000',
    '$2a$12$xVEzhL5JCWO2Qv1UwNXPqeUY0YvyRvqYorKMcXCLASLZ0/G3KGafi', -- admin123
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active;

-- 5️⃣ رسالة النجاح
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ تم إصلاح جدول المستخدمين بنجاح!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ الأعمدة المضافة/المعدلة:';
    RAISE NOTICE '   • password_hash - لحفظ كلمة المرور المشفرة';
    RAISE NOTICE '   • معلومات العائلة (father_name, student_phone, etc.)';
    RAISE NOTICE '   • معلومات التعليم (school_name, grade_level)';
    RAISE NOTICE '   • معلومات الموقع (country, city, address)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ تم إضافة مستخدم أدمن افتراضي:';
    RAISE NOTICE '   • البريد: admin@platform.edu';
    RAISE NOTICE '   • كلمة المرور: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 يمكنك الآن تشغيل COMPLETE_SYSTEM_SETUP.sql بدون أخطاء!';
    RAISE NOTICE '==============================================';
END $$;
