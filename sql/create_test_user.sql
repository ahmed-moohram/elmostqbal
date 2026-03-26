-- إنشاء مستخدم تجريبي للاختبار
INSERT INTO users (name, email, phone, password, role)
VALUES (
  'مستخدم تجريبي',
  'test@example.com',
  '01234567890',
  'MTIzNDU2Nzg=', -- كلمة المرور: 12345678 (مشفرة بـ btoa)
  'student'
)
ON CONFLICT (phone) 
DO UPDATE SET 
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- إنشاء مستخدم آخر
INSERT INTO users (name, email, phone, password, role)
VALUES (
  'أحمد محمد',
  'ahmed@example.com',
  '01111111111',
  'cGFzc3dvcmQxMjM=', -- كلمة المرور: password123 (مشفرة بـ btoa)
  'student'
)
ON CONFLICT (phone) 
DO UPDATE SET 
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  email = EXCLUDED.email;
