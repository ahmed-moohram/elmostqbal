import mongoose, { Schema, Document } from 'mongoose';

// نموذج الإنجازات
export interface IAchievement extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  type: 'quiz_completed' | 'lesson_completed' | 'course_completed' | 'certificate_earned' | 'assignment_submitted' | 'milestone_reached';
  title: string;
  description: string;
  points: number;
  metadata?: {
    score?: number;
    grade?: string;
    lessonId?: mongoose.Types.ObjectId;
    quizId?: mongoose.Types.ObjectId;
    timeSpent?: number; // بالدقائق
  };
  earnedAt: Date;
  isVisible: boolean;
  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['quiz_completed', 'lesson_completed', 'course_completed', 'certificate_earned', 'assignment_submitted', 'milestone_reached'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    score: { type: Number },
    grade: { type: String },
    lessonId: { type: Schema.Types.ObjectId },
    quizId: { type: Schema.Types.ObjectId },
    timeSpent: { type: Number }
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// إضافة فهارس للبحث السريع
AchievementSchema.index({ studentId: 1, courseId: 1 });
AchievementSchema.index({ earnedAt: -1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
