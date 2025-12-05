# 📊 دليل قاعدة البيانات - المنصة التعليمية

## 🚀 كيفية تشغيل قاعدة البيانات في Supabase

### 1️⃣ **إعداد Supabase:**
1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اذهب إلى **SQL Editor**
3. انسخ محتوى `database_schema.sql`
4. الصق والضغط على **Run**

### 2️⃣ **تحديث ملف `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📁 **الجداول الرئيسية:**

### 👥 **1. جدول المستخدمين (users)**
- **الوصف:** جدول موحد لجميع المستخدمين
- **الأدوار:** student, teacher, admin
- **الحقول المهمة:** email, password, name, phone, role, avatar_url

### 👨‍🏫 **2. جدول المدرسين (teachers)**
- **الوصف:** معلومات إضافية خاصة بالمدرسين
- **الحقول المهمة:** bio, specialization, experience_years, rating, total_students

### 👨‍🎓 **3. جدول الطلاب (students)**
- **الوصف:** معلومات إضافية خاصة بالطلاب
- **الحقول المهمة:** education_level, interests, total_courses_enrolled

### 📚 **4. جدول الكورسات (courses)**
- **الوصف:** جميع الكورسات في المنصة
- **الحقول المهمة:** title, teacher_id, price, rating, enrollment_count

### 📖 **5. جدول الدروس (lessons)**
- **الوصف:** دروس كل كورس
- **الحقول المهمة:** title, video_url, duration_minutes, is_free

### ✉️ **6. جدول الرسائل (messages)**
- **الوصف:** الشات بين المدرسين والطلاب
- **الحقول المهمة:** sender_id, receiver_id, content, course_id

### 📝 **7. جدول التسجيل (enrollments)**
- **الوصف:** تسجيلات الطلاب في الكورسات
- **الحقول المهمة:** student_id, course_id, progress_percentage

### 💰 **8. جدول المدفوعات (payments)**
- **الوصف:** معاملات الدفع
- **الحقول المهمة:** amount, student_id, course_id, status

---

## 🔧 **الدوال المساعدة:**

### 📊 **calculate_course_rating()**
```sql
-- حساب تقييم الكورس
SELECT calculate_course_rating('course-uuid-here');
```

### 👥 **calculate_teacher_students()**
```sql
-- حساب عدد طلاب المدرس
SELECT calculate_teacher_students('teacher-uuid-here');
```

### 📈 **calculate_student_progress()**
```sql
-- حساب تقدم الطالب
SELECT calculate_student_progress('enrollment-uuid-here');
```

---

## 🔐 **الأمان (RLS Policies):**

### للطلاب:
- ✅ عرض الكورسات المنشورة فقط
- ✅ عرض تسجيلاتهم الخاصة
- ✅ إرسال رسائل في الكورسات المشتركين فيها

### للمدرسين:
- ✅ إدارة كورساتهم بالكامل
- ✅ عرض طلابهم
- ✅ التواصل مع طلابهم

---

## 📝 **أمثلة استعلامات مفيدة:**

### 🔍 **جلب كورسات مدرس:**
```sql
SELECT * FROM courses 
WHERE teacher_id = 'teacher-uuid' 
AND is_published = true
ORDER BY created_at DESC;
```

### 📚 **جلب دروس كورس:**
```sql
SELECT l.*, cs.title as section_title
FROM lessons l
JOIN course_sections cs ON l.section_id = cs.id
WHERE l.course_id = 'course-uuid'
ORDER BY cs.order_index, l.order_index;
```

### 💬 **جلب رسائل كورس:**
```sql
SELECT m.*, u.name, u.avatar_url
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.course_id = 'course-uuid'
ORDER BY m.created_at DESC
LIMIT 50;
```

### 📊 **إحصائيات المدرس:**
```sql
SELECT 
  t.*,
  COUNT(DISTINCT e.student_id) as active_students,
  SUM(p.amount) as total_revenue,
  AVG(r.rating) as average_rating
FROM teachers t
LEFT JOIN enrollments e ON t.id = e.teacher_id
LEFT JOIN payments p ON t.id = p.teacher_id AND p.status = 'completed'
LEFT JOIN reviews r ON t.id = r.teacher_id
WHERE t.id = 'teacher-uuid'
GROUP BY t.id;
```

### 📈 **تقدم الطالب:**
```sql
SELECT 
  c.title,
  e.progress_percentage,
  COUNT(lp.id) as completed_lessons,
  COUNT(l.id) as total_lessons
FROM enrollments e
JOIN courses c ON e.course_id = c.id
LEFT JOIN lessons l ON c.id = l.course_id
LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id 
  AND lp.student_id = e.student_id 
  AND lp.is_completed = true
WHERE e.student_id = 'student-uuid'
GROUP BY c.id, e.id;
```

---

## 🔄 **المشغلات (Triggers):**

### ⚡ **تحديث تلقائي:**
- `updated_at` يتحدث تلقائياً عند أي تعديل
- إحصائيات الكورس تتحدث عند تسجيل جديد
- إشعار تلقائي عند رسالة جديدة

---

## 🎯 **الفهارس (Indexes):**
تم إضافة فهارس على:
- معرفات المدرسين والطلاب
- حالة النشر للكورسات
- التواريخ للترتيب الزمني
- معرفات الرسائل للبحث السريع

---

## 📤 **الترحيل من localStorage:**

```javascript
// ترحيل بيانات المدرس
const teacher = JSON.parse(localStorage.getItem('teacher'));
if (teacher) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: teacher.email,
      name: teacher.name,
      phone: teacher.phone,
      role: 'teacher'
    })
    .select()
    .single();
    
  if (data) {
    await supabase
      .from('teachers')
      .insert({
        user_id: data.id,
        bio: teacher.bio,
        specialization: teacher.specialization,
        experience_years: teacher.experience
      });
  }
}
```

---

## 🚨 **ملاحظات مهمة:**

1. **كلمات المرور:** يجب تشفيرها باستخدام Supabase Auth
2. **الصور:** استخدم Supabase Storage لرفع الصور
3. **الفيديوهات:** يُفضل استخدام YouTube/Vimeo للفيديوهات
4. **الأمان:** تأكد من تفعيل RLS على جميع الجداول
5. **النسخ الاحتياطي:** قم بعمل نسخ احتياطية دورية

---

## 📞 **الدعم:**
لأي استفسارات عن قاعدة البيانات، راجع:
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
