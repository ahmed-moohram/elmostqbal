-- =============================================
-- قاعدة البيانات للمنصة التعليمية - نسخة مُصلحة
-- =============================================

-- حذف الجداول إن وجدت (بترتيب عكسي للاعتماديات)
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS watch_sessions CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS teacher_earnings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS course_sections CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- إنشاء الجداول بالترتيب الصحيح

-- 1. جدول المستخدمين (الجدول الأساسي)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. جدول المدرسين
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialization VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  qualifications TEXT,
  languages TEXT[],
  linkedin_url VARCHAR(500),
  youtube_url VARCHAR(500),
  default_course_price DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_students INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. جدول الطلاب
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  education_level VARCHAR(100),
  interests TEXT[],
  learning_goals TEXT,
  total_courses_enrolled INTEGER DEFAULT 0,
  total_courses_completed INTEGER DEFAULT 0,
  total_certificates INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. جدول الكورسات
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  short_description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  language VARCHAR(50) DEFAULT 'ar',
  level VARCHAR(50) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  price DECIMAL(10,2) DEFAULT 0.00,
  discount_price DECIMAL(10,2),
  thumbnail TEXT,
  preview_video TEXT,
  duration_hours DECIMAL(5,2) DEFAULT 0.00,
  total_lessons INTEGER DEFAULT 0,
  total_sections INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  requirements TEXT[],
  what_you_will_learn TEXT[],
  target_audience TEXT[],
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  published_at TIMESTAMP WITH TIME ZONE
);

-- 5. جدول أقسام الكورس
CREATE TABLE course_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  lessons_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. جدول الدروس
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT,
  video_duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  resources TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. جدول التسجيل في الكورسات
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  total_watch_time_minutes INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  certificate_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, course_id)
);

-- 8. جدول تقدم الدروس
CREATE TABLE lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  watch_time_seconds INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(enrollment_id, lesson_id)
);

-- 9. جدول الرسائل/الشات
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'teacher')),
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[],
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 10. جدول الإشعارات
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 11. جدول المدفوعات
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EGP',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  teacher_share DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 12. جدول أرباح المدرسين
CREATE TABLE teacher_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'withdrawn')),
  withdrawal_method VARCHAR(50),
  withdrawal_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 13. جدول التقييمات
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(course_id, student_id)
);

-- 14. جدول الشهادات
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE,
  issue_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE NOT NULL,
  grade VARCHAR(20),
  certificate_url TEXT,
  verification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 15. جدول جلسات المشاهدة
CREATE TABLE watch_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50)
);

-- 16. جدول الاختبارات
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  pass_percentage DECIMAL(5,2) DEFAULT 60.00,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 17. جدول أسئلة الاختبارات
CREATE TABLE quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 18. جدول نتائج الاختبارات
CREATE TABLE quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  answers JSONB,
  attempt_number INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- الفهارس (Indexes) لتحسين الأداء
-- =============================================

CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lessons_section_id ON lessons(section_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_teacher_id ON enrollments(teacher_id);
CREATE INDEX idx_messages_course_id ON messages(course_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_teacher_id ON payments(teacher_id);
CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_watch_sessions_student_id ON watch_sessions(student_id);
CREATE INDEX idx_watch_sessions_lesson_id ON watch_sessions(lesson_id);

-- =============================================
-- الدوال المساعدة (Helper Functions)
-- =============================================

-- دالة لحساب تقييم الكورس
CREATE OR REPLACE FUNCTION calculate_course_rating(course_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_rating DECIMAL;
BEGIN
  SELECT AVG(rating)::DECIMAL(3,2) INTO avg_rating
  FROM reviews
  WHERE course_id = course_uuid;
  
  RETURN COALESCE(avg_rating, 0.00);
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب عدد الطلاب للمدرس
CREATE OR REPLACE FUNCTION calculate_teacher_students(teacher_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  student_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT student_id) INTO student_count
  FROM enrollments
  WHERE teacher_id = teacher_uuid;
  
  RETURN COALESCE(student_count, 0);
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب تقدم الطالب في الكورس
CREATE OR REPLACE FUNCTION calculate_student_progress(enrollment_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  completed_lessons INTEGER;
  total_lessons INTEGER;
  progress DECIMAL;
BEGIN
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress
  WHERE enrollment_id = enrollment_uuid AND is_completed = true;
  
  SELECT COUNT(*) INTO total_lessons
  FROM lessons l
  JOIN enrollments e ON l.course_id = e.course_id
  WHERE e.id = enrollment_uuid;
  
  IF total_lessons > 0 THEN
    progress := (completed_lessons::DECIMAL / total_lessons) * 100;
  ELSE
    progress := 0;
  END IF;
  
  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- المشغلات (Triggers)
-- =============================================

-- مشغل لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق المشغل على الجداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- مشغل محدث لتحديث إحصائيات الكورس
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- زيادة عدد الطلاب المسجلين
    UPDATE courses 
    SET enrollment_count = enrollment_count + 1
    WHERE id = NEW.course_id;
    
    -- تحديث عدد طلاب المدرس (تأكد من وجود teacher_id)
    IF NEW.teacher_id IS NOT NULL THEN
      UPDATE teachers 
      SET total_students = calculate_teacher_students(NEW.teacher_id)
      WHERE id = NEW.teacher_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- تقليل عدد الطلاب المسجلين
    UPDATE courses 
    SET enrollment_count = GREATEST(enrollment_count - 1, 0)
    WHERE id = OLD.course_id;
    
    -- تحديث عدد طلاب المدرس
    IF OLD.teacher_id IS NOT NULL THEN
      UPDATE teachers 
      SET total_students = calculate_teacher_students(OLD.teacher_id)
      WHERE id = OLD.teacher_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_enrollment_stats
AFTER INSERT OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_stats();

-- مشغل لإنشاء إشعار عند رسالة جديدة
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiver_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (
      NEW.receiver_id,
      'new_message',
      'رسالة جديدة',
      SUBSTRING(NEW.content, 1, 100),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_on_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- =============================================
-- بيانات تجريبية للاختبار
-- =============================================

-- إدراج مستخدم مدرس تجريبي
INSERT INTO users (id, email, password, name, phone, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'teacher@example.com', 'password123', 'أ. محمد أحمد', '01012345678', 'teacher')
ON CONFLICT (id) DO NOTHING;

-- إدراج ملف المدرس
INSERT INTO teachers (id, user_id, bio, specialization, experience_years)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'مدرس برمجة خبير', 'البرمجة والتطوير', 5)
ON CONFLICT (id) DO NOTHING;

-- إدراج مستخدم طالب تجريبي
INSERT INTO users (id, email, password, name, phone, role)
VALUES ('33333333-3333-3333-3333-333333333333', 'student@example.com', 'password123', 'أحمد محمد', '01098765432', 'student')
ON CONFLICT (id) DO NOTHING;

-- إدراج ملف الطالب
INSERT INTO students (id, user_id, education_level)
VALUES ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'جامعي')
ON CONFLICT (id) DO NOTHING;

-- إدراج كورس تجريبي
INSERT INTO courses (id, teacher_id, title, description, price, is_published)
VALUES ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'أساسيات البرمجة', 'تعلم البرمجة من الصفر', 299, true)
ON CONFLICT (id) DO NOTHING;

-- إدراج قسم في الكورس
INSERT INTO course_sections (id, course_id, title, order_index)
VALUES ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'المقدمة', 1)
ON CONFLICT (id) DO NOTHING;

-- إدراج درس
INSERT INTO lessons (id, course_id, section_id, title, video_url, order_index, is_free)
VALUES ('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'مقدمة عن البرمجة', 'https://youtube.com/watch?v=example', 1, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
