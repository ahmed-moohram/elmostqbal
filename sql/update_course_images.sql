-- =====================================================
-- تحديث صور الدورات والمدربين
-- =====================================================

-- تحديث صور الدورات لاستخدام صور من Unsplash
UPDATE public.courses SET
    thumbnail = CASE 
        WHEN slug = 'web-development-react-nextjs' THEN 
            'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80'
        WHEN slug = 'graphic-design-basics' THEN 
            'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80'
        WHEN slug = 'digital-marketing-advanced' THEN 
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
        WHEN slug = 'python-programming-beginners' THEN 
            'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80'
        WHEN slug = 'project-management-professional' THEN 
            'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80'
        ELSE thumbnail
    END,
    instructor_image = CASE 
        WHEN instructor_name = 'أحمد محمد' THEN 
            'https://i.pravatar.cc/150?img=11'
        WHEN instructor_name = 'سارة أحمد' THEN 
            'https://i.pravatar.cc/150?img=5'
        WHEN instructor_name = 'محمد علي' THEN 
            'https://i.pravatar.cc/150?img=12'
        WHEN instructor_name = 'خالد سعيد' THEN 
            'https://i.pravatar.cc/150?img=13'
        WHEN instructor_name = 'نور الدين أحمد' THEN 
            'https://i.pravatar.cc/150?img=14'
        ELSE instructor_image
    END
WHERE thumbnail LIKE '/%' OR instructor_image LIKE '/%';

-- التحقق من التحديث
SELECT 
    title,
    thumbnail,
    instructor_name,
    instructor_image
FROM public.courses;

-- =====================================================
-- ✅ تم تحديث الصور بنجاح!
-- =====================================================
