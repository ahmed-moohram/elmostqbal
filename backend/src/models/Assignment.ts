import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  fileUrl?: string;
  instructions?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  submittedAt: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  comments?: string;
  score?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  status: 'submitted' | 'graded' | 'late';
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
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
  dueDate: {
    type: Date,
    required: true
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  fileUrl: {
    type: String,
    required: false
  },
  instructions: {
    type: String,
    required: false,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const AssignmentSubmissionSchema: Schema = new Schema({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  comments: {
    type: String,
    required: false,
    trim: true
  },
  score: {
    type: Number,
    required: false,
    min: 0
  },
  feedback: {
    type: String,
    required: false,
    trim: true
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  gradedAt: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
AssignmentSchema.index({ courseId: 1, createdAt: -1 });
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ courseId: 1, status: 1 });
AssignmentSubmissionSchema.index({ studentId: 1, status: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema); 