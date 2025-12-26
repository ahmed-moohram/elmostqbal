// خدمة الإنجازات المرتبطة بالكورسات
import defaultSupabase from '@/lib/supabase-client';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge_image?: string;
  category: 'learning' | 'participation' | 'excellence' | 'completion';
  points: number;
  requirement_type: string;
  requirement_value: number;
  course_id?: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  course_id?: string;
  enrollment_id?: string;
  earned_at: string;
  progress: number;
  is_completed: boolean;
  achievement?: Achievement;
  course?: any;
}

export interface CourseProgress {
  course_id: string;
  course_title: string;
  enrollment_id: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  achievements_earned: UserAchievement[];
  next_achievement?: Achievement;
  points_earned: number;
}

export class AchievementsService {
  private supabase: any;
  private courseProgressCache = new Map<string, { ts: number; data: CourseProgress[] }>();
  private courseProgressInFlight = new Map<string, Promise<CourseProgress[]>>();
  private grantInFlight = new Map<string, Promise<Achievement[]>>();
  private allAchievementsCache: { ts: number; data: Achievement[] } | null = null;
  private allAchievementsInFlight: Promise<Achievement[]> | null = null;

  constructor(client: any = defaultSupabase) {
    this.supabase = client;
  }

  private async getAllAchievementsCached(): Promise<Achievement[]> {
    const supabase = this.supabase;
    const cached = this.allAchievementsCache;
    if (cached && Date.now() - cached.ts < 60000) {
      return cached.data;
    }

    if (this.allAchievementsInFlight) {
      return this.allAchievementsInFlight;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .order('points', { ascending: true });

        if (error) {
          console.error('❌ خطأ في جلب الإنجازات المتاحة:', error);
          return [];
        }

        return (data || []) as Achievement[];
      } catch (e) {
        console.error('❌ خطأ في جلب الإنجازات المتاحة:', e);
        return [];
      }
    })();

    this.allAchievementsInFlight = promise;
    try {
      const data = await promise;
      this.allAchievementsCache = { ts: Date.now(), data };
      return data;
    } finally {
      this.allAchievementsInFlight = null;
    }
  }

  private async getEnrollmentsForProgress(userId: string): Promise<any[]> {
    const supabase = this.supabase;
    if (!userId) return [];

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams();
        params.set('userId', userId);
        const res = await fetch(`/api/student/dashboard?${params.toString()}`);
        if (res.ok) {
          const body = await res.json().catch(() => null);
          const active = Array.isArray(body?.activeCourses) ? body.activeCourses : [];
          if (active.length > 0) {
            return active;
          }
        }
      } catch {
      }
    }

    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (enrollError) {
        console.error('❌ خطأ في جلب التسجيلات:', enrollError);
        return [];
      }

      return enrollments || [];
    } catch {
      return [];
    }
  }

  // جلب إنجازات المستخدم
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const supabase = this.supabase;
      console.log('🏆 جلب إنجازات المستخدم:', userId);
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*),
          course:courses(id, title, thumbnail)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في جلب الإنجازات:', error);
        return [];
      }

      console.log(`✅ تم جلب ${data?.length || 0} إنجاز`);
      return data || [];
    } catch (error) {
      console.error('❌ خطأ في الخدمة:', error);
      return [];
    }
  }

  // جلب إنجازات كورس معين
  async getCourseAchievements(courseId: string): Promise<Achievement[]> {
    try {
      const supabase = this.supabase;
      console.log('📚 جلب إنجازات الكورس:', courseId);
      
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true });

      if (error) {
        console.error('❌ خطأ في جلب إنجازات الكورس:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ خطأ في الخدمة:', error);
      return [];
    }
  }

  // جلب تقدم المستخدم في الكورسات مع الإنجازات
  async getUserCourseProgress(userId: string): Promise<CourseProgress[]> {
    const supabase = this.supabase;
    const cacheKey = String(userId || '').trim();
    if (!cacheKey) return [];

    const cached = this.courseProgressCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 15000) {
      return cached.data;
    }

    const inFlight = this.courseProgressInFlight.get(cacheKey);
   if (inFlight) {
      return inFlight;
    }

    const promise = (async () => {
      try {
      console.log('📊 جلب تقدم المستخدم في الكورسات');

      const enrollments = await this.getEnrollmentsForProgress(userId);

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // جلب الإنجازات لكل كورس
      const progressData: CourseProgress[] = [];

      const courseIds = Array.from(
        new Set(
          (enrollments || [])
            .map((enr: any) => enr?.course_id)
            .filter((id: any) => !!id)
            .map((id: any) => String(id))
        )
      );

      const lessonsCountByCourse = new Map<string, number>();
      if (courseIds.length > 0) {
        const { data: lessonsRows, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, course_id')
          .in('course_id', courseIds as any);

        if (lessonsError) {
          console.error('❌ خطأ في جلب الدروس:', lessonsError);
        } else {
          (lessonsRows || []).forEach((row: any) => {
            const cid = row?.course_id ? String(row.course_id) : '';
            if (!cid) return;
            lessonsCountByCourse.set(cid, (lessonsCountByCourse.get(cid) || 0) + 1);
          });
        }
      }

      const achievementsByCourse = new Map<string, any[]>();
      if (courseIds.length > 0) {
        const { data: achievementsRows, error: achievementsError } = await supabase
          .from('user_achievements')
          .select(`
            *,
            achievement:achievements(*)
          `)
          .eq('user_id', userId)
          .in('course_id', courseIds as any);

        if (achievementsError) {
          console.error('❌ خطأ في جلب إنجازات المستخدم للكورسات:', achievementsError);
        } else {
          (achievementsRows || []).forEach((row: any) => {
            const cid = row?.course_id ? String(row.course_id) : '';
            if (!cid) return;
            const arr = achievementsByCourse.get(cid) || [];
            arr.push(row);
            achievementsByCourse.set(cid, arr);
          });
        }
      }

      const allAchievements = await this.getAllAchievementsCached();

      for (const enrollment of enrollments) {
        const courseId = enrollment?.course_id ? String(enrollment.course_id) : '';
        const totalLessons = courseId ? lessonsCountByCourse.get(courseId) || 0 : 0;
        const progress = typeof enrollment?.progress === 'number' ? enrollment.progress : 0;
        const completedLessons =
          totalLessons > 0 ? Math.round((Math.max(0, Math.min(100, progress)) / 100) * totalLessons) : 0;

        const achievements = courseId ? achievementsByCourse.get(courseId) || [] : [];

        // حساب النقاط المكتسبة
        const pointsEarned = achievements?.reduce((sum, ua) => 
          sum + (ua.achievement?.points || 0), 0) || 0;

        const earnedAchievementIds = new Set(
          (achievements || [])
            .map((a: any) => a?.achievement_id)
            .filter(Boolean)
            .map((id: any) => String(id))
        );

        const nextAchievement = (allAchievements || []).find(
          (a: any) => a?.id && !earnedAchievementIds.has(String(a.id))
        );

        progressData.push({
          course_id: enrollment.course_id,
          course_title: enrollment.course?.title || '',
          enrollment_id: enrollment.id,
          progress: enrollment.progress || 0,
          completed_lessons: completedLessons || 0,
          total_lessons: totalLessons || 0,
          achievements_earned: achievements || [],
          next_achievement: nextAchievement,
          points_earned: pointsEarned
        });
      }

      console.log(`✅ تم جلب تقدم ${progressData.length} كورس`);
      return progressData;
      } catch (error) {
        console.error('❌ خطأ في الخدمة:', error);
        return [];
      }
    })();

    this.courseProgressInFlight.set(cacheKey, promise);
    try {
      const data = await promise;
      this.courseProgressCache.set(cacheKey, { ts: Date.now(), data });
      return data;
    } finally {
      this.courseProgressInFlight.delete(cacheKey);
    }
  }

  // التحقق من الإنجازات وإضافتها
  async checkAndGrantAchievements(userId: string, courseId?: string): Promise<Achievement[]> {
    const supabase = this.supabase;
    const key = `${String(userId || '').trim()}::${String(courseId || '').trim()}`;
    const inFlight = this.grantInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = (async () => {
      try {
      console.log('🔍 التحقق من الإنجازات الجديدة');
      
      // جلب إحصائيات المستخدم
      const stats = await this.getUserStats(userId);
      
      // إذا كان هناك كورس محدد، احسب عدد الدروس المكتملة في هذا الكورس فقط
      let courseLessonsCompleted = 0;
      if (courseId) {
        try {
          const { data: courseLessons, error: courseLessonsError } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', courseId);

          if (!courseLessonsError && courseLessons && courseLessons.length > 0) {
            const lessonIds = courseLessons.map(l => l.id);
            const { count: completedInCourse } = await supabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('is_completed', true)
              .in('lesson_id', lessonIds);

            courseLessonsCompleted = completedInCourse || 0;
          }
        } catch (courseStatsError) {
          console.error('❌ خطأ في حساب تقدم الكورس للإنجازات:', courseStatsError);
        }
      }
      
      // جلب جميع الإنجازات المتاحة
      const allAchievements = await this.getAllAchievementsCached();

      if (!allAchievements || allAchievements.length === 0) {
        return [];
      }

      // جلب الإنجازات المحققة بالفعل
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const earnedIds = userAchievements?.map(ua => ua.achievement_id) || [];
      const newAchievements: Achievement[] = [];

      // التحقق من كل إنجاز
      for (const achievement of allAchievements || []) {
        if (earnedIds.includes(achievement.id)) continue;

        let earned = false;

        switch (achievement.requirement_type) {
          case 'lessons_completed':
            // إذا كان الإنجاز مرتبطاً بكورس محدد، استخدم عدد دروس هذا الكورس فقط
            if (courseId && achievement.course_id === courseId) {
              earned = courseLessonsCompleted >= achievement.requirement_value;
            } else {
              // إنجازات عامة تعتمد على مجموع الدروس المكتملة لكل الكورسات
              earned = stats.lessons_completed >= achievement.requirement_value;
            }
            break;
          case 'courses_completed':
            earned = stats.courses_completed >= achievement.requirement_value;
            break;
          case 'study_hours':
            earned = stats.study_hours >= achievement.requirement_value;
            break;
          case 'quiz_score':
            earned = stats.average_quiz_score >= achievement.requirement_value;
            break;
          case 'study_streak':
            earned = stats.current_streak >= achievement.requirement_value;
            break;
        }

        if (earned) {
          // منح الإنجاز
          await this.grantAchievement(userId, achievement.id, courseId);
          newAchievements.push(achievement);
        }
      }

      if (newAchievements.length > 0) {
        const cacheKey = String(userId || '').trim();
        if (cacheKey) {
          this.courseProgressCache.delete(cacheKey);
        }
        console.log(`🎉 تم منح ${newAchievements.length} إنجاز جديد!`);
      }

      return newAchievements;
      } catch (error) {
        console.error('❌ خطأ في التحقق من الإنجازات:', error);
        return [];
      }
    })();

    this.grantInFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.grantInFlight.delete(key);
    }
  }

  // منح إنجاز للمستخدم
  private async grantAchievement(userId: string, achievementId: string, courseId?: string, enrollmentId?: string) {
    try {
      const supabase = this.supabase;
      // إضافة الإنجاز
      const { data: userAchievement, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          is_completed: true,
          progress: 100
        })
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في منح الإنجاز:', error);
        return null;
      }

      // جلب تفاصيل الإنجاز
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (achievement) {
        // إضافة النقاط
        await this.addPoints(userId, achievement.points, 'achievement_earned', achievement.title, achievementId);
        
        // تحديث إحصائيات المستخدم
        await this.updateUserStats(userId);
      }

      return userAchievement;
    } catch (error) {
      console.error('❌ خطأ في منح الإنجاز:', error);
      return null;
    }
  }

  // إضافة نقاط للمستخدم
  private async addPoints(userId: string, points: number, action: string, description: string, referenceId?: string) {
    try {
      const supabase = this.supabase;
      // إضافة سجل النقاط
      await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          points: points,
          action: action,
          description: description,
          achievement_id: referenceId
        });

      // تحديث إجمالي النقاط
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (userPoints) {
        await supabase
          .from('user_points')
          .update({
            total_points: userPoints.total_points + points,
            current_level: this.calculateLevel(userPoints.total_points + points),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            total_points: points,
            current_level: this.calculateLevel(points)
          });
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة النقاط:', error);
    }
  }

  // حساب المستوى بناءً على النقاط
  private calculateLevel(points: number): number {
    if (points < 100) return 1;
    if (points < 250) return 2;
    if (points < 500) return 3;
    if (points < 1000) return 4;
    if (points < 2000) return 5;
    if (points < 5000) return 6;
    if (points < 10000) return 7;
    return 8;
  }

  // جلب إحصائيات المستخدم
  private async getUserStats(userId: string) {
    try {
      const supabase = this.supabase;
      // عدد الدروس المكتملة
      const { count: lessonsCompleted } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true);

      // عدد الكورسات المكتملة
      const { count: coursesCompleted } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('progress', 100);

      // متوسط درجات الاختبارات
      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('score')
        .eq('user_id', userId);

      const averageQuizScore = quizResults && quizResults.length > 0
        ? quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length
        : 0;

      // النقاط والمستوى الحالي
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        lessons_completed: lessonsCompleted || 0,
        courses_completed: coursesCompleted || 0,
        average_quiz_score: averageQuizScore,
        study_hours: 0, // يمكن حسابها من سجل النشاط
        current_streak: userPoints?.current_streak || 0,
        total_points: userPoints?.total_points || 0,
        current_level: userPoints?.current_level || 1
      };
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
      return {
        lessons_completed: 0,
        courses_completed: 0,
        average_quiz_score: 0,
        study_hours: 0,
        current_streak: 0,
        total_points: 0,
        current_level: 1
      };
    }

   }

  // تحديث إحصائيات المستخدم
  private async updateUserStats(userId: string) {
    try {
      const supabase = this.supabase;
      const stats = await this.getUserStats(userId);
      
      // تحديث أو إنشاء سجل النقاط
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // ... rest of the code remains the same ...
      if (userPoints) {
        await supabase
          .from('user_points')
          .update({
            courses_completed: stats.courses_completed,
            lessons_completed: stats.lessons_completed,
            achievements_earned: await this.getUserAchievementsCount(userId),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            courses_completed: stats.courses_completed,
            lessons_completed: stats.lessons_completed,
            achievements_earned: await this.getUserAchievementsCount(userId)
          });
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث الإحصائيات:', error);
    }
  }

  // عدد إنجازات المستخدم
  private async getUserAchievementsCount(userId: string): Promise<number> {
    const supabase = this.supabase;
    const { count } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);
    
    return count || 0;
  }

  // جلب لوحة المتصدرين
  async getLeaderboard(periodType: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time') {
    try {
      const supabase = this.supabase;
      console.log('🏅 جلب لوحة المتصدرين:', periodType);
      
      const query = supabase
        .from('leaderboard')
        .select(`
          *,
          user:users(id, name, email, avatar)
        `)
        .eq('period_type', periodType)
        .order('points', { ascending: false })
        .limit(10);

      if (periodType !== 'all_time') {
        const date = new Date();
        if (periodType === 'daily') {
          query.eq('period_date', date.toISOString().split('T')[0]);
        } else if (periodType === 'weekly') {
          // الأسبوع الحالي
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          query.gte('period_date', weekStart.toISOString().split('T')[0]);
        } else if (periodType === 'monthly') {
          // الشهر الحالي
          query.eq('period_date', `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ خطأ في جلب لوحة المتصدرين:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ خطأ في الخدمة:', error);
      return [];
    }
  }
}

export const achievementsService = new AchievementsService();
