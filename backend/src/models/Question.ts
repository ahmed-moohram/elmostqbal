import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  courseId: mongoose.Types.ObjectId;
  lessonId?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  isResolved: boolean;
  tags: string[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnswer extends Document {
  questionId: mongoose.Types.ObjectId;
  content: string;
  author: mongoose.Types.ObjectId;
  isAccepted: boolean;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const AnswerSchema: Schema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
QuestionSchema.index({ courseId: 1, createdAt: -1 });
QuestionSchema.index({ lessonId: 1, createdAt: -1 });
QuestionSchema.index({ author: 1, createdAt: -1 });
QuestionSchema.index({ isResolved: 1 });
QuestionSchema.index({ tags: 1 });

AnswerSchema.index({ questionId: 1, createdAt: -1 });
AnswerSchema.index({ author: 1, createdAt: -1 });
AnswerSchema.index({ isAccepted: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
export const Answer = mongoose.model<IAnswer>('Answer', AnswerSchema); 