import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  email: string;
  phone: string;
  parentPhone: string;
  grade: string;
  courses: {
    courseId: mongoose.Types.ObjectId;
    progress: number;
    completedLessons: mongoose.Types.ObjectId[];
    lastAccessed: Date;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    unique: true,
    trim: true
  },
  parentPhone: {
    type: String,
    required: [true, 'رقم هاتف ولي الأمر مطلوب'],
    trim: true
  },
  grade: {
    type: String,
    required: [true, 'الصف الدراسي مطلوب'],
    trim: true
  },
  courses: [{
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      type: Schema.Types.ObjectId,
      ref: 'Course.lessons'
    }],
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// إضافة فهارس للبحث السريع
StudentSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const Student = mongoose.model<IStudent>('Student', StudentSchema); 