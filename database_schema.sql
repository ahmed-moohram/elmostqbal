-- =============================================
-- قاعدة البيانات للمنصة التعليمية
-- =============================================

-- جدول المستخدمين (موحد للطلاب والمدرسين)
CREATE TABLE IF NOT EXISTS users (
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

-- جدول المدرسين (معلومات إضافية)
CREATE TABLE IF NOT EXISTS teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialization VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  qualifications TEXT,
  languages TEXT[], -- array of languages
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

-- جدول الطلاب (معلومات إضافية)
CREATE TABLE IF NOT EXISTS students (
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

-- جدول الكورسات (محدث)
CREATE TABLE IF NOT EXISTS courses (
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

-- جدول أقسام الكورس
CREATE TABLE IF NOT EXISTS course_sections (
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

-- جدول الدروس (محدث)
CREATE TABLE IF NOT EXISTS lessons (
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
  resources TEXT[], -- روابط الملفات المرفقة
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- جدول التسجيل في الكورسات
CREATE TABLE IF NOT EXISTS enrollments (
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

-- جدول تقدم الدروس
CREATE TABLE IF NOT EXISTS lesson_progress (
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

-- جدول الرسائل/الشات
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'teacher')),
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[], -- روابط المرفقات
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- للردود
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  related_id UUID, -- معرف العنصر المرتبط (كورس، رسالة، الخ)
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EGP',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  teacher_share DECIMAL(10,2), -- حصة المدرس
  platform_fee DECIMAL(10,2), -- عمولة المنصة
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- جدول أرباح المدرسين
CREATE TABLE IF NOT EXISTS teacher_earnings (
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

-- جدول التقييمات
CREATE TABLE IF NOT EXISTS reviews (
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

-- جدول الشهادات
CREATE TABLE IF NOT EXISTS certificates (
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

-- جدول جلسات المشاهدة (لتتبع النشاط)
CREATE TABLE IF NOT EXISTS watch_sessions (
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

-- جدول الاختبارات
CREATE TABLE IF NOT EXISTS quizzes (
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

-- جدول أسئلة الاختبارات
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB, -- خيارات الإجابة
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- جدول نتائج الاختبارات
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  answers JSONB, -- إجابات الطالب
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

-- مشغل لتحديث إحصائيات الكورس
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- زيادة عدد الطلاب المسجلين
    UPDATE courses 
    SET enrollment_count = enrollment_count + 1
    WHERE id = NEW.course_id;
    
    -- تحديث عدد طلاب المدرس
    UPDATE teachers 
    SET total_students = calculate_teacher_students(NEW.teacher_id)
    WHERE id = NEW.teacher_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- تقليل عدد الطلاب المسجلين
    UPDATE courses 
    SET enrollment_count = enrollment_count - 1
    WHERE id = OLD.course_id;
    
    -- تحديث عدد طلاب المدرس
    UPDATE teachers 
    SET total_students = calculate_teacher_students(OLD.teacher_id)
    WHERE id = OLD.teacher_id;
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
  INSERT INTO notifications (user_id, type, title, content, related_id)
  VALUES (
    NEW.receiver_id,
    'new_message',
    'رسالة جديدة',
    SUBSTRING(NEW.content, 1, 100),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_on_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- =============================================
-- صلاحيات RLS (Row Level Security)
-- =============================================

-- تفعيل RLS على الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- سياسات الصلاحيات للطلاب
CREATE POLICY "Students can view published courses" ON courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Students can view their enrollments" ON enrollments
  FOR SELECT USING (auth.uid()::uuid = student_id);

CREATE POLICY "Students can send messages in enrolled courses" ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = sender_id AND 
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE student_id = auth.uid()::uuid 
      AND course_id = messages.course_id
    )
  );

-- سياسات الصلاحيات للمدرسين
CREATE POLICY "Teachers can manage their courses" ON courses
  FOR ALL USING (teacher_id = auth.uid()::uuid);

CREATE POLICY "Teachers can view their students" ON enrollments
  FOR SELECT USING (teacher_id = auth.uid()::uuid);

CREATE POLICY "Teachers can send messages to their students" ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = sender_id AND 
    sender_role = 'teacher' AND
    EXISTS (
      SELECT 1 FROM courses 
      WHERE teacher_id = auth.uid()::uuid 
      AND id = messages.course_id
    )
  );

-- =============================================
-- بيانات تجريبية (اختياري)
-- =============================================

-- إدراج مستخدم مدرس تجريبي
INSERT INTO users (email, password, name, phone, role)
VALUES ('teacher@example.com', 'password123', 'أ. محمد أحمد', '01012345678', 'teacher')
ON CONFLICT (email) DO NOTHING;

-- إدراج مستخدم طالب تجريبي
INSERT INTO users (email, password, name, phone, role)
VALUES ('student@example.com', 'password123', 'أحمد محمد', '01098765432', 'student')
ON CONFLICT (email) DO NOTHING;
