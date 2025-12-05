import mongoose, { Schema, Document } from 'mongoose';

// نموذج الأجهزة المسجلة
export interface IDevice extends Document {
  studentId: mongoose.Types.ObjectId;
  deviceId: string; // معرف فريد للجهاز
  deviceInfo: {
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    ipAddress: string;
  };
  isBlocked: boolean;
  blockedReason?: string;
  lastActive: Date;
  loginCount: number;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceInfo: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true
    },
    os: {
      type: String,
      required: true
    },
    browser: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    }
  },
  isBlocked: {
    type: Boolean,
    default: false,
    index: true
  },
  blockedReason: {
    type: String
  },
  lastActive: {
    type: Date,
    default: Date.now,
    index: true
  },
  loginCount: {
    type: Number,
    default: 1
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// فهرس مركب للبحث عن أجهزة طالب معين
DeviceSchema.index({ studentId: 1, isBlocked: 1 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
