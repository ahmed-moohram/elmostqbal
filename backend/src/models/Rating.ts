import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  user: mongoose.Types.ObjectId;
  targetType: 'course' | 'teacher';
  targetId: mongoose.Types.ObjectId;
  rating: number; // 1-5 stars
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['course', 'teacher'],
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound index to ensure one rating per user per target
RatingSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Index for efficient querying
RatingSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model<IRating>('Rating', RatingSchema); 