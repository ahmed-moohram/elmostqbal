import mongoose, { Schema, Document } from 'mongoose';

// نموذج الأقسام (Sections/Modules) للدورات
export interface ISection extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  isPublished: boolean;
  videos: {
    _id?: mongoose.Types.ObjectId;
    title: string;
    description: string;
    videoUrl: string;
    duration: number; // بالثواني
    thumbnail?: string;
    order: number;
    isPreview: boolean; // يمكن مشاهدته بدون تسجيل
    allowDownload: boolean;
    allowSharing: boolean; // منع المشاركة
    quality: {
      hd?: string;
      sd?: string;
      mobile?: string;
    };
    resources?: {
      title: string;
      type: 'pdf' | 'doc' | 'image' | 'link';
      url: string;
      size?: string;
    }[];
    viewCount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  videos: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    videoUrl: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 0
    },
    thumbnail: {
      type: String
    },
    order: {
      type: Number,
      required: true,
      default: 0
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    allowDownload: {
      type: Boolean,
      default: false
    },
    allowSharing: {
      type: Boolean,
      default: false
    },
    quality: {
      hd: { type: String },
      sd: { type: String },
      mobile: { type: String }
    },
    resources: [{
      title: { type: String },
      type: { type: String, enum: ['pdf', 'doc', 'image', 'link'] },
      url: { type: String },
      size: { type: String }
    }],
    viewCount: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// فهرس للبحث والترتيب
SectionSchema.index({ courseId: 1, order: 1 });

export const Section = mongoose.model<ISection>('Section', SectionSchema);
