-- إنشاء Storage Bucket للصور
-- =======================

-- 1. إنشاء bucket للصور (إذا لم يكن موجوداً)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images', 
  true, -- عام (يمكن الوصول إليه بدون مصادقة)
  5242880, -- 5MB حد أقصى لحجم الملف
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. إضافة سياسة للسماح بالرفع للمستخدمين المصادق عليهم
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

-- 3. إضافة سياسة للسماح بالقراءة العامة
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

-- 4. إضافة سياسة للسماح بالحذف للمستخدمين المصادق عليهم
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');

-- 5. إضافة سياسة للسماح بالتحديث للمستخدمين المصادق عليهم  
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images');

-- تحقق من إنشاء الـ bucket
SELECT * FROM storage.buckets WHERE id = 'images';

-- ملاحظة: 
-- يجب تشغيل هذا السكريبت في Supabase Dashboard
-- اذهب إلى SQL Editor وقم بلصق هذا الكود وتشغيله
