-- التحقق من بنية جدول الكورسات
SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- إضافة الأعمدة المفقودة إن لم تكن موجودة
DO $$
BEGIN
    -- إضافة عمود language إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'language') THEN
        ALTER TABLE courses ADD COLUMN language VARCHAR(10) DEFAULT 'ar';
        RAISE NOTICE 'تم إضافة عمود language';
    END IF;

    -- إضافة عمود requirements إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'requirements') THEN
        ALTER TABLE courses ADD COLUMN requirements TEXT[] DEFAULT '{}';
        RAISE NOTICE 'تم إضافة عمود requirements';
    END IF;

    -- إضافة عمود what_will_learn إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'what_will_learn') THEN
        ALTER TABLE courses ADD COLUMN what_will_learn TEXT[] DEFAULT '{}';
        RAISE NOTICE 'تم إضافة عمود what_will_learn';
    END IF;

    -- إضافة عمود has_certificate إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'has_certificate') THEN
        ALTER TABLE courses ADD COLUMN has_certificate BOOLEAN DEFAULT true;
        RAISE NOTICE 'تم إضافة عمود has_certificate';
    END IF;

    -- إضافة عمود enrollment_count إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'enrollment_count') THEN
        ALTER TABLE courses ADD COLUMN enrollment_count INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود enrollment_count';
    END IF;

    -- إضافة عمود rating إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'rating') THEN
        ALTER TABLE courses ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود rating';
    END IF;

    -- إضافة عمود updated_at إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'updated_at') THEN
        ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'تم إضافة عمود updated_at';
    END IF;
END $$;

-- عرض البنية النهائية
SELECT 'البنية النهائية لجدول الكورسات:' as info;
SELECT 
    column_name as "العمود",
    data_type as "النوع"
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;
