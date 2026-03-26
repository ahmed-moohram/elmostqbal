# 📚 قاعدة بيانات منصة التعليم الإلكترونية

## 🎯 نظرة عامة
قاعدة بيانات PostgreSQL متكاملة لمنصة تعليمية إلكترونية، مصممة للعمل مع Supabase وتدعم جميع احتياجات التعلم الإلكتروني.

## 🚀 المميزات الرئيسية

### ✅ نظام مستخدمين متكامل
- أدوار متعددة (طالب، ولي أمر، مدرس، مدير)
- نظام صلاحيات متقدم (RLS)
- إدارة الأجهزة والجلسات
- التحقق من الهوية

### 📚 نظام الكورسات
- كورسات متعددة المستويات
- أقسام ودروس منظمة
- موارد تعليمية متنوعة
- فيديوهات بجودات مختلفة
- نظام معاينة مجانية

### 💳 نظام المدفوعات
- طرق دفع متعددة
- كوبونات خصم
- خطط اشتراك مرنة
- فواتير تلقائية
- تقارير مالية

### 🎓 نظام التقييم
- اختبارات تفاعلية
- واجبات ومهام
- تقييمات ومراجعات
- شهادات إتمام
- نظام إنجازات

### 📡 التفاعل المباشر
- جلسات مباشرة
- دردشة فورية
- منتدى أسئلة وأجوبة
- نظام إشعارات

## 📁 هيكل الملفات

```
sql/
├── 01_schema.sql           # الجداول الأساسية والأنواع
├── 02_enrollments_payments.sql # التسجيلات والمدفوعات
├── 03_live_sessions_assignments.sql # الجلسات والواجبات
├── 04_indexes_constraints.sql # الفهارس والقيود
├── 05_security_rls.sql     # الأمان وسياسات RLS
├── 06_initial_data.sql     # البيانات الأولية
├── supabase_setup.sql      # إعداد Supabase
├── migration_from_mongo.js # تحويل من MongoDB
└── README.md               # هذا الملف
```

## 🛠️ التثبيت

### 1. إعداد Supabase

#### إنشاء مشروع جديد:
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب أو سجل دخول
3. انقر على "New Project"
4. اختر اسم المشروع وكلمة مرور قاعدة البيانات
5. اختر المنطقة الأقرب لك

#### تنفيذ SQL:
1. اذهب إلى SQL Editor في Supabase
2. نفذ الملفات بالترتيب:
   ```sql
   -- 1. نفذ محتوى 01_schema.sql
   -- 2. نفذ محتوى 02_enrollments_payments.sql
   -- 3. نفذ محتوى 03_live_sessions_assignments.sql
   -- 4. نفذ محتوى 04_indexes_constraints.sql
   -- 5. نفذ محتوى 05_security_rls.sql
   -- 6. نفذ محتوى 06_initial_data.sql
   ```

### 2. إعداد GitHub

#### رفع الملفات:
```bash
# إنشاء مستودع جديد
git init
git add .
git commit -m "Initial database schema"
git branch -M main
git remote add origin https://github.com/username/education-platform-db.git
git push -u origin main
```

#### GitHub Actions للنسخ الاحتياطي:
```yaml
# .github/workflows/backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *' # يومياً في 2 صباحاً
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Backup Database
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          # أوامر النسخ الاحتياطي
```

## 🔐 الأمان

### Row Level Security (RLS)
- ✅ جميع الجداول محمية بـ RLS
- ✅ سياسات مخصصة لكل دور
- ✅ التحقق من الصلاحيات على مستوى الصف

### أفضل الممارسات:
1. **كلمات المرور**: استخدم bcrypt للتشفير
2. **JWT Tokens**: للمصادقة
3. **SSL/TLS**: لتشفير الاتصال
4. **Backup**: نسخ احتياطية يومية
5. **Monitoring**: مراقبة الأداء والأمان

## 📊 الجداول الرئيسية

### جدول المستخدمين (users)
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255)
- email: VARCHAR(255)
- role: ENUM
- status: ENUM
- created_at: TIMESTAMP
```

### جدول الكورسات (courses)
```sql
- id: UUID (Primary Key)
- title: VARCHAR(255)
- instructor_id: UUID (Foreign Key)
- price: DECIMAL
- status: ENUM
- created_at: TIMESTAMP
```

### جدول التسجيلات (enrollments)
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- course_id: UUID (Foreign Key)
- progress: DECIMAL
- enrolled_at: TIMESTAMP
```

## 🔄 التحويل من MongoDB

لتحويل البيانات الموجودة من MongoDB:

```javascript
// استخدم migration_from_mongo.js
node migration_from_mongo.js --source mongodb://localhost:27017/old_db --target postgresql://...
```

## 📈 الأداء

### الفهارس المُحسّنة:
- فهارس على جميع المفاتيح الخارجية
- فهارس البحث النصي باللغة العربية
- فهارس مركبة للاستعلامات الشائعة

### نصائح الأداء:
1. استخدم `EXPLAIN ANALYZE` لتحليل الاستعلامات
2. راقب حجم الجداول والفهارس
3. استخدم التقسيم (Partitioning) للجداول الكبيرة
4. قم بـ VACUUM و ANALYZE دورياً

## 🧪 الاختبار

### اختبار الاتصال:
```sql
-- اختبار الاتصال
SELECT current_database(), current_user, version();

-- اختبار الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- اختبار RLS
SELECT * FROM users; -- يجب أن يعرض فقط المستخدم الحالي
```

### بيانات تجريبية:
```sql
-- إنشاء مستخدم تجريبي
INSERT INTO users (name, email, role) 
VALUES ('Test User', 'test@example.com', 'student');

-- إنشاء كورس تجريبي
INSERT INTO courses (title, instructor_id, price) 
VALUES ('كورس تجريبي', [instructor_uuid], 100);
```

## 📝 الصيانة

### مهام دورية:
1. **يومياً**: نسخ احتياطي
2. **أسبوعياً**: تحليل الأداء
3. **شهرياً**: تنظيف البيانات القديمة
4. **ربع سنوي**: مراجعة الأمان

### أوامر مفيدة:
```sql
-- حجم قاعدة البيانات
SELECT pg_database_size(current_database());

-- حجم الجداول
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- الاتصالات النشطة
SELECT count(*) FROM pg_stat_activity;

-- إحصائيات الاستعلامات
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## 🆘 الدعم والمساعدة

### موارد مفيدة:
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQL Tutorial](https://www.w3schools.com/sql/)

### حل المشاكل الشائعة:

**مشكلة: RLS يمنع الوصول**
```sql
-- تحقق من السياسات
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- أضف سياسة مؤقتة للاختبار
CREATE POLICY temp_allow_all ON your_table FOR ALL USING (true);
```

**مشكلة: بطء الاستعلامات**
```sql
-- تحليل الاستعلام
EXPLAIN ANALYZE SELECT * FROM your_table WHERE condition;

-- إضافة فهرس
CREATE INDEX idx_name ON your_table(column);
```

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 👥 المساهمون

- معتصم - المطور الرئيسي
- [اسمك هنا] - المساهمات مرحب بها!

## 📞 التواصل

للأسئلة والاقتراحات:
- Email: support@platform.com
- GitHub Issues: [github.com/username/repo/issues](https://github.com/username/repo/issues)

---

**تم التحديث**: نوفمبر 2024
**الإصدار**: 1.0.0
**الحالة**: ✅ جاهز للإنتاج
