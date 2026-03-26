import mongoose, { Schema, Document } from 'mongoose';

// تحديد واجهات مفصلة لمكونات الكورس
interface Resource {
  title: string;
  type: 'pdf' | 'doc' | 'video' | 'link' | 'image' | 'other';
  url: string;
  isDownloadable: boolean;
  size?: string; // بالميجابايت
  description?: string;
  order: number;
}

interface Lesson {
  title: string;
  description: string;
  videoUrl: string;
  duration: number; // بالدقائق
  resources: Resource[];
  order: number;
  isPreview: boolean;
  thumbnail?: string;
  watched?: number; // عدد مشاهدات الدرس
  videoEncoding?: {
    hd: string;
    sd: string;
    mobile: string;
  };
}

interface Section {
    title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface Review {
  userId: mongoose.Types.ObjectId;
  rating: number; // 1-5
    comment: string;
  createdAt: Date;
  likes: number;
  isVerifiedPurchase: boolean;
  response?: {
    text: string;
    date: Date;
  };
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
  points: number;
}

interface Quiz {
  title: string;
  description?: string;
  questions: Question[];
  timeLimit?: number; // بالدقائق
  passingScore: number; // النسبة المئوية للنجاح
  order: number;
  isRequired: boolean;
}

interface Coupon {
  code: string;
  discount: number; // قيمة الخصم
  discountType: 'percentage' | 'fixed'; // نوع الخصم (نسبة مئوية أو قيمة ثابتة)
  expiryDate: Date;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

interface PaymentOption {
  type: 'free' | 'onetime' | 'subscription';
  price: number;
  discountPrice?: number;
  currency?: string;
  validUntil?: Date;
  installmentOptions?: {
    months: number;
    monthlyAmount: number;
  }[];
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  instructor: mongoose.Types.ObjectId;
  coInstructors?: mongoose.Types.ObjectId[];
  
  // خيارات الدفع المتنوعة
  paymentOptions: PaymentOption[];
  
  // الصور والعرض
  thumbnail: string;
  previewVideo?: string;
  coverImage?: string;
  gallery?: string[];
  
  // التصنيف
  category: string;
  subCategory?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  
  // معلومات إضافية
  language: string;
  tags: string[];
  sections: Section[];
  totalLessons: number;
  totalDuration: number; // بالدقائق
  
  // معلومات الطلاب والتقييمات
  studentsCount: number;
  students: mongoose.Types.ObjectId[]; // قائمة الطلاب المسجلين
  rating: number;
  ratingCount: number;
  reviews: Review[];
  
  // المحتوى التفاعلي
  quizzes: Quiz[];
  
  // المميزات والمتطلبات
  features: string[];
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  
  // تخصيص عرض الكورس
  isFeatured: boolean;
  isBestseller: boolean;
  isPublished: boolean;
  isActive: boolean;
  
  // كوبونات الخصم
  coupons: Coupon[];
  
  // التحكم في الكورس
  accessibility: {
    hasLifetimeAccess: boolean;
    accessDuration?: number; // بالأيام
    hasCertificate: boolean;
    hasAssignments: boolean;
    hasForumAccess: boolean;
    hasRefundPolicy: boolean;
    refundPeriod?: number; // بالأيام
  };
  
  // المحتوى التسويقي
  meta: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    faq?: { question: string; answer: string }[];
  };
  
  // التواريخ
  publishedAt: Date;
  startDate?: Date;
  enrollmentEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // للدورات الحية
  liveSession?: {
    scheduledTimes: { date: Date; duration: number }[];
    zoomLink?: string;
    recordingsAvailable: boolean;
  };
}

const CourseSchema = new Schema<ICourse>(
  {
  title: {
    type: String,
    required: [true, 'عنوان الكورس مطلوب'],
      trim: true,
      minlength: [5, 'عنوان الكورس يجب أن يكون 5 أحرف على الأقل'],
      maxlength: [100, 'عنوان الكورس لا يجب أن يتجاوز 100 حرف'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
  },
  description: {
    type: String,
    required: [true, 'وصف الكورس مطلوب'],
    trim: true,
    minlength: [10, 'وصف الكورس يجب أن يكون 10 أحرف على الأقل'],
  },
    shortDescription: {
      type: String,
      required: [true, 'الوصف المختصر مطلوب'],
      trim: true,
      maxlength: [200, 'الوصف المختصر لا يجب أن يتجاوز 200 حرف'],
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coInstructors: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    }],
    
    // خيارات الدفع
    paymentOptions: [{
      type: {
        type: String,
        enum: ['free', 'onetime', 'subscription'],
        required: true,
        default: 'onetime',
  },
  price: {
    type: Number,
        required: true,
        min: 0,
  },
      discountPrice: {
    type: Number,
        min: 0,
  },
      currency: {
    type: String,
        default: 'EGP',
      },
      validUntil: {
        type: Date,
      },
      installmentOptions: [{
        months: Number,
        monthlyAmount: Number,
      }],
    }],
    
    // الصور والعرض
    thumbnail: {
      type: String,
      required: true,
    },
    previewVideo: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    gallery: [{
      type: String,
    }],
    
    // التصنيف
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subCategory: {
      type: String,
      index: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
      required: true,
      default: 'all-levels',
    },
    
    // معلومات إضافية
    language: {
      type: String,
      required: true,
      default: 'ar',
    },
    tags: [{
      type: String,
      index: true,
    }],
    sections: [{
      title: { type: String, required: true },
      description: { type: String },
      order: { type: Number, required: true },
      lessons: [{
        title: { type: String, required: true },
        description: { type: String },
        videoUrl: { type: String, required: true },
        duration: { type: Number, required: true },
        resources: [{
          title: { type: String, required: true },
          type: { 
            type: String, 
            enum: ['pdf', 'doc', 'video', 'link', 'image', 'other'],
            required: true 
          },
          url: { type: String, required: true },
          isDownloadable: { type: Boolean, default: true },
          size: { type: String },
          description: { type: String },
          order: { type: Number, required: true, default: 0 },
        }],
        order: { type: Number, required: true },
        isPreview: { type: Boolean, default: false },
        thumbnail: { type: String },
        watched: { type: Number, default: 0 },
        videoEncoding: {
          hd: { type: String },
          sd: { type: String },
          mobile: { type: String },
        },
      }],
    }],
    totalLessons: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    
    // معلومات الطلاب والتقييمات
    studentsCount: {
      type: Number,
      default: 0,
    },
    students: [{
      type: Schema.Types.ObjectId, 
      ref: 'User'
    }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    reviews: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now },
      likes: { type: Number, default: 0 },
      isVerifiedPurchase: { type: Boolean, default: true },
      response: {
        text: { type: String },
        date: { type: Date },
      }
    }],
    
    // المحتوى التفاعلي
    quizzes: [{
      title: { type: String, required: true },
      description: { type: String },
      questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true },
        explanation: { type: String },
        points: { type: Number, default: 1 },
      }],
      timeLimit: { type: Number }, // بالدقائق
      passingScore: { type: Number, required: true, default: 70 }, // النسبة المئوية للنجاح
      order: { type: Number, required: true },
      isRequired: { type: Boolean, default: false },
    }],
    
    // المميزات والمتطلبات
    features: [{
      type: String,
    }],
    requirements: [{
      type: String,
    }],
    whatYouWillLearn: [{
      type: String,
    }],
    targetAudience: [{
      type: String,
    }],
    
    // تخصيص عرض الكورس
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // كوبونات الخصم
    coupons: [{
      code: { type: String, required: true, uppercase: true },
      discount: { type: Number, required: true, min: 0 },
      discountType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
      required: true
      },
      expiryDate: { type: Date, required: true },
      usageLimit: { type: Number, default: 100 },
      usageCount: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    }],
    
    // التحكم في الكورس
    accessibility: {
      hasLifetimeAccess: { type: Boolean, default: true },
      accessDuration: { type: Number }, // بالأيام
      hasCertificate: { type: Boolean, default: false },
      hasAssignments: { type: Boolean, default: false },
      hasForumAccess: { type: Boolean, default: false },
      hasRefundPolicy: { type: Boolean, default: false },
      refundPeriod: { type: Number },
    },
    
    // المحتوى التسويقي
    meta: {
      seoTitle: { type: String },
      seoDescription: { type: String },
      seoKeywords: [{ type: String }],
      faq: [{
        question: { type: String },
        answer: { type: String },
      }],
    },
    
    // التواريخ
    publishedAt: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    enrollmentEndDate: {
      type: Date,
    },
    
    // للدورات الحية
    liveSession: {
      scheduledTimes: [{
        date: { type: Date },
        duration: { type: Number }, // بالدقائق
      }],
      zoomLink: { type: String },
      recordingsAvailable: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// حساب المدة الإجمالية وعدد الدروس قبل الحفظ
CourseSchema.pre('save', function(next) {
  // حساب عدد الدروس الإجمالي
  let totalLessons = 0;
  let totalDuration = 0;
  
  if (this.sections && this.sections.length > 0) {
    this.sections.forEach(section => {
      if (section.lessons && section.lessons.length > 0) {
        totalLessons += section.lessons.length;
        totalDuration += section.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
      }
    });
  }
  
  this.totalLessons = totalLessons;
  this.totalDuration = totalDuration;
  next();
});

// حساب النسبة المئوية للخصم
CourseSchema.virtual('discountPercentage').get(function() {
  if (this.paymentOptions && this.paymentOptions.length > 0) {
    const mainOption = this.paymentOptions.find(option => option.type === 'onetime');
    if (mainOption && mainOption.discountPrice && mainOption.price > 0) {
      return Math.round(((mainOption.price - mainOption.discountPrice) / mainOption.price) * 100);
    }
  }
  return 0;
});

// إضافة فهارس للبحث السريع
// Text index معطل مؤقتاً بسبب مشكلة اللغة العربية
// CourseSchema.index({ 
//   title: 'text', 
//   description: 'text', 
//   category: 'text', 
//   tags: 'text' 
// }, { 
//   default_language: 'none',
//   language_override: 'language'
// });

CourseSchema.index({ title: 1 }); // بحث عادي بدلاً من text search
CourseSchema.index({ category: 1 }); // بحث بالفئة
CourseSchema.index({ isPublished: 1, isActive: 1 }); // للاستعلامات المتكررة
CourseSchema.index({ rating: -1 }); // للترتيب حسب التقييم
CourseSchema.index({ studentsCount: -1 }); // للترتيب حسب الشعبية

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course; 