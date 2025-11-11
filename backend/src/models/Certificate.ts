import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  certificateNumber: string;
  issueDate: Date;
  completionDate: Date;
  grade?: number;
  status: 'issued' | 'pending' | 'revoked';
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema: Schema = new Schema({
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
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  grade: {
    type: Number,
    required: false,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['issued', 'pending', 'revoked'],
    default: 'issued'
  },
  certificateUrl: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one certificate per student per course
CertificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Index for efficient querying
CertificateSchema.index({ certificateNumber: 1 });
CertificateSchema.index({ studentId: 1, status: 1 });

// Generate certificate number
CertificateSchema.pre('save', async function(next) {
  if (this.isNew && !this.certificateNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Certificate').countDocuments({
      issueDate: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.certificateNumber = `CERT-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<ICertificate>('Certificate', CertificateSchema); 