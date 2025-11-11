import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveSession extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  teacherId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  duration: number; // in minutes
  maxParticipants: number;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  platform: 'zoom' | 'google-meet' | 'teams' | 'custom';
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  participants: mongoose.Types.ObjectId[];
  recordingUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiveSessionSchema: Schema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  meetingUrl: {
    type: String,
    required: false
  },
  meetingId: {
    type: String,
    required: false
  },
  meetingPassword: {
    type: String,
    required: false
  },
  platform: {
    type: String,
    enum: ['zoom', 'google-meet', 'teams', 'custom'],
    default: 'zoom'
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  recordingUrl: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
LiveSessionSchema.index({ courseId: 1, scheduledAt: 1 });
LiveSessionSchema.index({ teacherId: 1, scheduledAt: 1 });
LiveSessionSchema.index({ status: 1, scheduledAt: 1 });
LiveSessionSchema.index({ participants: 1 });

// Virtual for end time
LiveSessionSchema.virtual('endAt').get(function() {
  return new Date(this.scheduledAt.getTime() + this.duration * 60000);
});

// Virtual for isUpcoming
LiveSessionSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const startTime = new Date(this.scheduledAt.getTime() - 15 * 60000); // 15 minutes before
  return now < startTime;
});

// Virtual for isLive
LiveSessionSchema.virtual('isLive').get(function() {
  const now = new Date();
  const startTime = new Date(this.scheduledAt.getTime() - 15 * 60000); // 15 minutes before
  const endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
  return now >= startTime && now <= endTime;
});

export default mongoose.model<ILiveSession>('LiveSession', LiveSessionSchema); 