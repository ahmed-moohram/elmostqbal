-- =============================================
-- إصلاح جدول جلسات المستخدمين
-- =============================================

-- 1️⃣ التحقق من وجود الجدول وإضافة الأعمدة المفقودة
DO $$
BEGIN
    -- إنشاء الجدول إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        CREATE TABLE user_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            token TEXT UNIQUE NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ تم إنشاء جدول user_sessions';
    ELSE
        -- إذا كان الجدول موجوداً، نتحقق من الأعمدة
        -- التحقق من وجود العمود token
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            AND column_name = 'token'
        ) THEN
            ALTER TABLE user_sessions ADD COLUMN token TEXT UNIQUE;
            RAISE NOTICE '✅ تم إضافة العمود token';
        END IF;
        
        -- التحقق من وجود العمود user_id
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE user_sessions ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
            RAISE NOTICE '✅ تم إضافة العمود user_id';
        END IF;
        
        -- التحقق من وجود العمود ip_address
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            AND column_name = 'ip_address'
        ) THEN
            ALTER TABLE user_sessions ADD COLUMN ip_address VARCHAR(45);
            RAISE NOTICE '✅ تم إضافة العمود ip_address';
        END IF;
        
        -- التحقق من وجود العمود user_agent
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            AND column_name = 'user_agent'
        ) THEN
            ALTER TABLE user_sessions ADD COLUMN user_agent TEXT;
            RAISE NOTICE '✅ تم إضافة العمود user_agent';
        END IF;
        
        -- التحقق من وجود العمود expires_at
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            AND column_name = 'expires_at'
        ) THEN
            ALTER TABLE user_sessions ADD COLUMN expires_at TIMESTAMPTZ;
            RAISE NOTICE '✅ تم إضافة العمود expires_at';
        END IF;
        
        -- التحقق من وجود العمود created_at
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE user_sessions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE '✅ تم إضافة العمود created_at';
        END IF;
    END IF;
END $$;

-- 2️⃣ إصلاح جدول user_preferences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        CREATE TABLE user_preferences (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            language VARCHAR(10) DEFAULT 'ar',
            theme VARCHAR(10) DEFAULT 'light',
            email_notifications BOOLEAN DEFAULT true,
            sms_notifications BOOLEAN DEFAULT false,
            whatsapp_notifications BOOLEAN DEFAULT true,
            marketing_emails BOOLEAN DEFAULT false,
            course_reminders BOOLEAN DEFAULT true,
            payment_reminders BOOLEAN DEFAULT true,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ تم إنشاء جدول user_preferences';
    END IF;
END $$;

-- 3️⃣ إصلاح جدول user_activities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activities') THEN
        CREATE TABLE user_activities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            action VARCHAR(100) NOT NULL,
            description TEXT,
            metadata JSONB,
            ip_address VARCHAR(45),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ تم إنشاء جدول user_activities';
    END IF;
END $$;

-- 4️⃣ إضافة الفهارس
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON user_activities(created_at DESC);

-- 5️⃣ عرض بنية الجداول للتأكد
DO $$
DECLARE
    sessions_cols TEXT;
    prefs_cols TEXT;
    activities_cols TEXT;
BEGIN
    -- جمع أسماء أعمدة user_sessions
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO sessions_cols
    FROM information_schema.columns
    WHERE table_name = 'user_sessions';
    
    -- جمع أسماء أعمدة user_preferences
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO prefs_cols
    FROM information_schema.columns
    WHERE table_name = 'user_preferences';
    
    -- جمع أسماء أعمدة user_activities
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO activities_cols
    FROM information_schema.columns
    WHERE table_name = 'user_activities';
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ تم إصلاح الجداول بنجاح!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 بنية الجداول الحالية:';
    RAISE NOTICE '';
    RAISE NOTICE '1️⃣ user_sessions:';
    RAISE NOTICE '   الأعمدة: %', sessions_cols;
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ user_preferences:';
    RAISE NOTICE '   الأعمدة: %', prefs_cols;
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ user_activities:';
    RAISE NOTICE '   الأعمدة: %', activities_cols;
    RAISE NOTICE '';
    RAISE NOTICE '✅ الآن يمكنك تشغيل users_table.sql بدون أخطاء!';
    RAISE NOTICE '==============================================';
END $$;
