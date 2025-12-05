export interface Exam {
  id: string;
  title: string;
  courseId: string;
  duration: number; // بالدقائق
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  type: 'multipleChoice' | 'trueFalse' | 'fillIn' | 'matching';
  content: string;
  options?: string[]; // للأسئلة المتعددة الاختيارات
  correctAnswer: string | string[];
  timeLimit?: number; // بالثواني
  explanation?: string;
}

export interface ExamSettings {
  examId: string;
  courseId: string;
  duration: number;
  questionTypes: string[];
  timePerQuestion?: number;
  passingScore?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface ExamResult {
  examId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers: Record<string, any>;
  createdAt: Date;
}