import mongoose, { Document, Types, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  fatherName: string;
  studentPhone: string;
  parentPhone: string;
  motherPhone?: string;
  phone?: string; // للمدرسين والأدمن
  specialty?: string; // للمدرسين
  guardianJob?: string;
  schoolName?: string;
  city?: string;
  gradeLevel?: string;
  email?: string;
  password: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  image?: string;
  purchasedBooks: Types.ObjectId[];
  profilePicture?: string;
  loginAttempts: number;
  lastLoginAttempt?: Date;
  lastActive?: Date;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true
  },
  fatherName: {
    type: String,
    required: [true, 'اسم الأب مطلوب'],
    trim: true
  },
  studentPhone: {
      type: String,
    required: [true, 'رقم هاتف الطالب مطلوب'],
      unique: true,
      trim: true,
    validate: {
      validator: function(v: string) {
        return /^0\d{10}$/.test(v);
      },
      message: 'رقم الهاتف يجب أن يبدأ بـ 0 ويكون 11 رقمًا'
    }
  },
  parentPhone: {
    type: String,
    required: [true, 'رقم هاتف ولي الأمر مطلوب'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^0\d{10}$/.test(v);
      },
      message: 'رقم الهاتف يجب أن يبدأ بـ 0 ويكون 11 رقمًا'
    }
  },
  motherPhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^0\d{10}$/.test(v);
      },
      message: 'رقم الهاتف يجب أن يبدأ بـ 0 ويكون 11 رقمًا'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  specialty: {
    type: String,
    trim: true
  },
  guardianJob: {
    type: String,
    trim: true
  },
  schoolName: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true,
    default: 'السويس'
  },
  gradeLevel: {
    type: String,
    enum: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
    default: 'الصف الثالث الثانوي'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'صيغة البريد الإلكتروني غير صحيحة'
    }
    },
    password: {
      type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل']
    },
    role: {
      type: String,
    enum: ['student', 'parent', 'teacher', 'admin'],
    default: 'student'
  },
  image: {
    type: String,
    default: '/placeholder-profile.jpg'
  },
  profilePicture: {
    type: String,
    default: '/placeholder-profile.jpg'
  },
  purchasedBooks: [{
    type: Schema.Types.ObjectId,
    ref: 'Book'
  }],
  loginAttempts: {
    type: Number,
    default: 0
  },
  lastLoginAttempt: {
    type: Date,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  resetPasswordCode: String,
  resetPasswordExpires: Date,
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// مقارنة كلمة المرور
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export const User = mongoose.model<IUser>('User', userSchema); 