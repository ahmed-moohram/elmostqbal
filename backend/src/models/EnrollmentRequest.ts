import mongoose, { Schema, Document } from 'mongoose';

// نموذج طلبات التسجيل والدفع
export interface IEnrollmentRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  paymentInfo: {
    method: 'vodafone_cash' | 'bank_transfer' | 'instapay' | 'credit_card' | 'other';
    amount: number;
    transactionId?: string;
    receiptImage: string;
    phoneNumber?: string;
    accountNumber?: string;
  };
  studentInfo: {
    name: string;
    email: string;
    phone: string;
    parentPhone: string;
  };
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  approvalMessage?: string;
  rejectionReason?: string;
  expiresAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentRequestSchema = new Schema<IEnrollmentRequest>({
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['vodafone_cash', 'bank_transfer', 'instapay', 'credit_card', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    transactionId: {
      type: String
    },
    receiptImage: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String
    },
    accountNumber: {
      type: String
    }
  },
  studentInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    parentPhone: {
      type: String,
      required: true
    }
  },
  adminNotes: {
    type: String
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  approvalMessage: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// فهارس للبحث السريع
EnrollmentRequestSchema.index({ status: 1, submittedAt: -1 });
EnrollmentRequestSchema.index({ studentId: 1, courseId: 1 });

export const EnrollmentRequest = mongoose.model<IEnrollmentRequest>('EnrollmentRequest', EnrollmentRequestSchema);
