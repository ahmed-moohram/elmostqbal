-- ========================================
-- جداول إنجازات الطالب والتفاعل
-- ========================================

-- 1. جدول الإنجازات والأوسمة
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    badge_image TEXT,
    category VARCHAR(100), -- 'learning', 'participation', 'excellence', 'completion'
    points INT DEFAULT 0,
    requirement_type VARCHAR(50), -- 'courses_completed', 'lessons_watched', 'quiz_score', 'study_hours'
    requirement_value INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول إنجازات الطالب
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0, -- نسبة التقدم نحو الإنجاز
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

-- 3. جدول النقاط والمستويات
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    current_streak INT DEFAULT 0, -- عدد الأيام المتتالية
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول سجل النقاط
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL,
    action VARCHAR(100), -- 'lesson_completed', 'quiz_passed', 'achievement_earned'
    description TEXT,
    reference_id UUID, -- معرف الدرس أو الاختبار أو الإنجاز
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول التفاعلات (إعجابات، تعليقات)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50), -- 'lesson', 'course', 'comment', 'review'
    target_id UUID NOT NULL,
    interaction_type VARCHAR(20), -- 'like', 'bookmark', 'share'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_id, interaction_type)
);

-- 6. جدول التعليقات والمناقشات
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- للردود
    target_type VARCHAR(50), -- 'lesson', 'course', 'assignment'
    target_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_answer BOOLEAN DEFAULT FALSE, -- إذا كان جواب معتمد
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول الشارات الخاصة
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    color VARCHAR(7), -- hex color
    rarity VARCHAR(20), -- 'common', 'rare', 'epic', 'legendary'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. جدول شارات الطالب
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- 9. جدول التحديات والمسابقات
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'special'
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    reward_points INT DEFAULT 0,
    reward_badge_id UUID REFERENCES badges(id),
    max_participants INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. جدول المشاركين في التحديات
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(10,2) DEFAULT 0,
    rank INT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, user_id)
);

-- 11. جدول لوحة المتصدرين
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'all_time'
    period_date DATE,
    points INT DEFAULT 0,
    rank INT,
    courses_completed INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    study_hours DECIMAL(10,2) DEFAULT 0,
    UNIQUE(user_id, period_type, period_date)
);

-- 12. جدول سجل النشاطات
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50), -- 'login', 'lesson_start', 'lesson_complete', 'quiz_attempt'
    activity_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- إضافة البيانات التجريبية
-- ========================================

-- إضافة إنجازات
INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value) VALUES
('البداية الموفقة', 'أكمل درسك الأول', '🎯', 'learning', 10, 'lessons_watched', 1),
('الطالب المجتهد', 'أكمل 10 دروس', '📚', 'learning', 50, 'lessons_watched', 10),
('النجم الصاعد', 'أكمل دورة كاملة', '⭐', 'completion', 100, 'courses_completed', 1),
('المثابر', 'ادرس لمدة 7 أيام متتالية', '🔥', 'participation', 75, 'study_hours', 7),
('العبقري', 'احصل على 100% في 5 اختبارات', '🏆', 'excellence', 200, 'quiz_score', 5),
('المتفوق', 'احصل على المركز الأول في التحدي الأسبوعي', '🥇', 'excellence', 150, 'courses_completed', 1),
('الباحث', 'اكتب 10 تعليقات مفيدة', '💬', 'participation', 30, 'lessons_watched', 10),
('المستكشف', 'جرب 5 دورات مختلفة', '🗺️', 'learning', 40, 'courses_completed', 5);

-- إضافة شارات
INSERT INTO badges (name, description, image_url, color, rarity) VALUES
('نجم البداية', 'شارة الترحيب للطلاب الجدد', '/badges/star.png', '#FFD700', 'common'),
('المتفوق', 'للطلاب المتميزين', '/badges/excellence.png', '#FF6B6B', 'rare'),
('الأسطورة', 'أعلى مستوى من الإنجاز', '/badges/legend.png', '#9C27B0', 'legendary'),
('المثابر', 'للدراسة المستمرة', '/badges/persistent.png', '#4CAF50', 'rare'),
('العالم', 'للمعرفة الواسعة', '/badges/scholar.png', '#2196F3', 'epic');

-- إضافة تحديات
INSERT INTO challenges (title, description, challenge_type, start_date, end_date, reward_points) VALUES
('تحدي الأسبوع', 'أكمل 5 دروس هذا الأسبوع', 'weekly', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 100),
('ماراثون التعلم', 'ادرس لمدة 10 ساعات هذا الشهر', 'monthly', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 500),
('تحدي السرعة', 'أكمل درس في أقل من 15 دقيقة', 'daily', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', 25);

-- ========================================
-- الدوال المساعدة
-- ========================================

-- دالة لحساب مستوى الطالب
CREATE OR REPLACE FUNCTION calculate_user_level(points INT)
RETURNS INT AS $$
BEGIN
    RETURN CASE
        WHEN points < 100 THEN 1
        WHEN points < 250 THEN 2
        WHEN points < 500 THEN 3
        WHEN points < 1000 THEN 4
        WHEN points < 2000 THEN 5
        WHEN points < 5000 THEN 6
        WHEN points < 10000 THEN 7
        ELSE 8
    END;
END;
$$ LANGUAGE plpgsql;

-- دالة لإضافة نقاط للطالب
CREATE OR REPLACE FUNCTION add_points_to_user(
    p_user_id UUID,
    p_points INT,
    p_action VARCHAR,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_total_points INT;
BEGIN
    -- إضافة سجل النقاط
    INSERT INTO points_history (user_id, points, action, description, reference_id)
    VALUES (p_user_id, p_points, p_action, p_description, p_reference_id);
    
    -- تحديث إجمالي النقاط
    INSERT INTO user_points (user_id, total_points, current_level)
    VALUES (p_user_id, p_points, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_points = user_points.total_points + p_points,
        current_level = calculate_user_level(user_points.total_points + p_points),
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من الإنجازات
CREATE OR REPLACE FUNCTION check_user_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_title VARCHAR) AS $$
DECLARE
    v_lessons_count INT;
    v_courses_count INT;
    v_quiz_perfect_count INT;
    v_study_days INT;
BEGIN
    -- حساب الإحصائيات
    SELECT COUNT(*) INTO v_lessons_count 
    FROM lesson_progress 
    WHERE user_id = p_user_id AND is_completed = TRUE;
    
    SELECT COUNT(DISTINCT course_id) INTO v_courses_count 
    FROM enrollments 
    WHERE user_id = p_user_id AND progress >= 100;
    
    -- التحقق من الإنجازات وإضافتها
    RETURN QUERY
    INSERT INTO user_achievements (user_id, achievement_id, is_completed)
    SELECT p_user_id, a.id, TRUE
    FROM achievements a
    WHERE NOT EXISTS (
        SELECT 1 FROM user_achievements ua 
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
    AND (
        (a.requirement_type = 'lessons_watched' AND v_lessons_count >= a.requirement_value)
        OR (a.requirement_type = 'courses_completed' AND v_courses_count >= a.requirement_value)
    )
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING achievement_id, (SELECT title FROM achievements WHERE id = achievement_id);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- الفهارس للأداء
-- ========================================

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_points_history_user ON points_history(user_id);
CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_target ON interactions(target_id, target_type);
CREATE INDEX idx_comments_target ON comments(target_id, target_type);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_leaderboard_period ON leaderboard(period_type, period_date);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);

-- ========================================
-- تعطيل RLS مؤقتاً
-- ========================================

ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE points_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- ========================================
-- رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إنشاء جداول الإنجازات والتفاعل بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الجداول المنشأة:';
    RAISE NOTICE '- achievements: الإنجازات المتاحة';
    RAISE NOTICE '- user_achievements: إنجازات الطلاب';
    RAISE NOTICE '- user_points: نقاط ومستويات الطلاب';
    RAISE NOTICE '- interactions: التفاعلات (إعجاب، حفظ)';
    RAISE NOTICE '- comments: التعليقات والمناقشات';
    RAISE NOTICE '- badges: الشارات الخاصة';
    RAISE NOTICE '- challenges: التحديات والمسابقات';
    RAISE NOTICE '- leaderboard: لوحة المتصدرين';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 الإنجازات المضافة: 8';
    RAISE NOTICE '🏅 الشارات المضافة: 5';
    RAISE NOTICE '🏆 التحديات المضافة: 3';
    RAISE NOTICE '========================================';
END $$;
