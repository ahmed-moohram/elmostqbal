-- ========================================
-- تابع: منصة التعليم الإلكترونية
-- الجزء الثالث: الجلسات المباشرة والواجبات
-- ========================================

-- ========================================
-- 9. جداول الجلسات المباشرة
-- ========================================

-- جدول الجلسات المباشرة
CREATE TABLE live_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- التوقيت
    scheduled_at TIMESTAMP NOT NULL,
    duration INT NOT NULL CHECK (duration >= 15 AND duration <= 480), -- بالدقائق
    timezone VARCHAR(50) DEFAULT 'Africa/Cairo',
    
    -- معلومات الاجتماع
    platform session_platform DEFAULT 'zoom',
    meeting_url TEXT,
    meeting_id VARCHAR(255),
    meeting_password VARCHAR(100),
    
    -- القيود
    max_participants INT DEFAULT 100,
    current_participants INT DEFAULT 0,
    
    -- الحالة
    status session_status DEFAULT 'scheduled',
    
    -- التسجيل
    recording_url TEXT,
    recording_duration INT, -- بالدقائق
    recording_size BIGINT, -- بالبايت
    recording_available BOOLEAN DEFAULT FALSE,
    
    -- الملاحظات والمواد
    notes TEXT,
    materials_url TEXT,
    
    -- التواريخ
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المشاركين في الجلسات المباشرة
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- معلومات الحضور
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    duration INT, -- بالدقائق
    
    -- التفاعل
    messages_count INT DEFAULT 0,
    questions_asked INT DEFAULT 0,
    
    -- الحالة
    is_registered BOOLEAN DEFAULT TRUE,
    attended BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع التسجيل المكرر
    UNIQUE(session_id, user_id)
);

-- جدول رسائل الجلسة المباشرة (Chat)
CREATE TABLE session_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_question BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES session_messages(id), -- للردود
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول تسجيلات الجلسات
CREATE TABLE session_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255),
    url TEXT NOT NULL,
    duration INT NOT NULL, -- بالدقائق
    file_size BIGINT, -- بالبايت
    quality VARCHAR(20), -- HD, SD, etc
    views_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 10. جداول الواجبات والمهام
-- ========================================

-- جدول الواجبات
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- المعلومات الأساسية
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    
    -- الملفات المرفقة
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    attachment_size BIGINT,
    
    -- التقييم
    max_score DECIMAL(5,2) DEFAULT 100 CHECK (max_score > 0),
    passing_score DECIMAL(5,2) DEFAULT 60,
    weight DECIMAL(5,2) DEFAULT 1, -- الوزن في الدرجة النهائية
    
    -- المواعيد
    available_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    late_submission_allowed BOOLEAN DEFAULT FALSE,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 10, -- نسبة الخصم للتأخير
    
    -- الإعدادات
    max_attempts INT DEFAULT 1,
    allow_file_upload BOOLEAN DEFAULT TRUE,
    allow_text_entry BOOLEAN DEFAULT TRUE,
    max_file_size BIGINT DEFAULT 10485760, -- 10MB default
    allowed_file_types TEXT[], -- مثل: {pdf, doc, docx}
    
    -- الحالة
    is_published BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول تسليمات الواجبات
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id),
    attempt_number INT DEFAULT 1,
    
    -- المحتوى المقدم
    text_content TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    
    -- التقييم
    score DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    
    -- الحالة
    status submission_status DEFAULT 'submitted',
    is_late BOOLEAN DEFAULT FALSE,
    late_penalty_applied DECIMAL(5,2) DEFAULT 0,
    
    -- التواريخ
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع التسليم المكرر لنفس المحاولة
    UNIQUE(assignment_id, student_id, attempt_number)
);

-- جدول ملفات التسليم (للتسليمات متعددة الملفات)
CREATE TABLE submission_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول تعليقات التقييم
CREATE TABLE submission_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE, -- تعليق خاص للمدرسين فقط
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 11. جداول الأسئلة والمنتدى
-- ========================================

-- جدول أسئلة الطلاب
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    
    -- المحتوى
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- التصنيف
    tags TEXT[],
    category VARCHAR(50),
    
    -- الإحصائيات
    views_count INT DEFAULT 0,
    answers_count INT DEFAULT 0,
    upvotes_count INT DEFAULT 0,
    
    -- الحالة
    is_resolved BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    
    -- أفضل إجابة
    best_answer_id UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الإجابات
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    
    -- التقييم
    upvotes_count INT DEFAULT 0,
    downvotes_count INT DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    is_instructor_answer BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول التصويتات
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    voteable_id UUID NOT NULL, -- يمكن أن يكون question_id أو answer_id
    voteable_type VARCHAR(20) NOT NULL CHECK (voteable_type IN ('question', 'answer')),
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع التصويت المكرر
    UNIQUE(user_id, voteable_id, voteable_type)
);

-- ========================================
-- 12. جداول الرسائل والإشعارات
-- ========================================

-- جدول الرسائل الخاصة
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- الحالة
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted_by_sender BOOLEAN DEFAULT FALSE,
    is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
    
    -- المرفقات
    has_attachment BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الإشعارات
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- البيانات الإضافية
    data JSONB,
    action_url TEXT,
    
    -- الحالة
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- الأولوية
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول إعدادات الإشعارات للمستخدمين
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    
    -- أنواع الإشعارات
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    -- تفاصيل الإشعارات
    new_course_announcement BOOLEAN DEFAULT TRUE,
    assignment_reminder BOOLEAN DEFAULT TRUE,
    quiz_reminder BOOLEAN DEFAULT TRUE,
    live_session_reminder BOOLEAN DEFAULT TRUE,
    grade_posted BOOLEAN DEFAULT TRUE,
    course_update BOOLEAN DEFAULT TRUE,
    reply_to_question BOOLEAN DEFAULT TRUE,
    promotional_emails BOOLEAN DEFAULT FALSE,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 13. جداول الإنجازات والشهادات
-- ========================================

-- جدول الإنجازات
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    badge_url TEXT,
    
    -- الشروط
    criteria JSONB NOT NULL,
    points INT DEFAULT 0,
    
    -- التصنيف
    category VARCHAR(50),
    level VARCHAR(20) CHECK (level IN ('bronze', 'silver', 'gold', 'platinum')),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول إنجازات المستخدمين
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    course_id UUID REFERENCES courses(id),
    
    -- التفاصيل
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- منع الإنجاز المكرر
    UNIQUE(user_id, achievement_id, course_id)
);

-- جدول الشهادات
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    
    -- معلومات الشهادة
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    
    -- التفاصيل
    grade VARCHAR(10),
    score DECIMAL(5,2),
    
    -- الملفات
    pdf_url TEXT,
    image_url TEXT,
    
    -- التحقق
    verification_code VARCHAR(100) UNIQUE,
    is_valid BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع الشهادة المكررة
    UNIQUE(user_id, course_id)
);

-- ========================================
-- يتبع في الملف التالي...
-- ========================================
