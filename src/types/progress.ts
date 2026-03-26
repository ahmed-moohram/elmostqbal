export interface CourseProgress {
  courseId: string | number;
  completedLessons: string[];
  currentLesson: string;
  percentComplete: number;
  lastAccessed?: string;
  startDate?: string;
}

export interface UserProgress {
  userId: string;
  courses: CourseProgress[];
  totalCompletedCourses: number;
  totalHoursSpent: number;
  streak?: number;
}
