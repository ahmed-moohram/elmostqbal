import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  email: string;
  phone: string;
  bio: string;
  specialization: string;
  experience: number;
  courses: mongoose.Types.ObjectId[];
  profileImage?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  ratings: {
    studentId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    date: Date;
  }[];
  averageRating: number;
  totalStudents: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema = new Schema({
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
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'التخصص مطلوب'],
    trim: true
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  profileImage: {
    type: String,
    default: ''
  },
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String,
    website: String
  },
  ratings: [{
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// حساب متوسط التقييم تلقائياً
TeacherSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0);
    this.averageRating = sum / this.ratings.length;
  }
  next();
});

// إضافة فهارس للبحث السريع
TeacherSchema.index({ name: 'text', specialization: 'text', bio: 'text' });
TeacherSchema.index({ email: 1 });

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
