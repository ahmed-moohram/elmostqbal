import { Request, Response } from 'express';
import LiveSession from '../models/LiveSession';
import { User } from '../models/User';
import Course from '../models/Course';

// Create new live session (Teacher only)
export const createLiveSession = async (req: Request, res: Response) => {
  try {
    const { 
      courseId, 
      title, 
      description, 
      scheduledAt, 
      duration, 
      maxParticipants, 
      platform = 'zoom',
      meetingUrl,
      meetingId,
      meetingPassword 
    } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId || !courseId || !title || !description || !scheduledAt || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create live sessions' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if scheduled time is in the future
    const scheduledTime = new Date(scheduledAt);
    if (scheduledTime <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    const liveSession = new LiveSession({
      courseId,
      title,
      description,
      teacherId,
      scheduledAt: scheduledTime,
      duration,
      maxParticipants: maxParticipants || 50,
      platform,
      meetingUrl,
      meetingId,
      meetingPassword
    });

    await liveSession.save();

    // Populate teacher and course details
    await liveSession.populate('teacherId', 'name');
    await liveSession.populate('courseId', 'title');

    res.status(201).json({
      message: 'Live session created successfully',
      data: liveSession
    });
  } catch (error) {
    console.error('Error creating live session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get live sessions for a course
export const getCourseLiveSessions = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const liveSessions = await LiveSession.find({ courseId })
      .populate('teacherId', 'name avatar')
      .populate('participants', 'name')
      .sort({ scheduledAt: 1 });

    res.json({
      message: 'Live sessions retrieved successfully',
      data: liveSessions
    });
  } catch (error) {
    console.error('Error getting live sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get upcoming live sessions
export const getUpcomingLiveSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query: any = {
      scheduledAt: { $gte: new Date() },
      status: { $in: ['scheduled', 'live'] }
    };

    // If student, only show sessions for courses they're enrolled in
    if (user.role === 'student') {
      // This would need to be implemented based on your enrollment system
      // For now, we'll show all upcoming sessions
    }

    const liveSessions = await LiveSession.find(query)
      .populate('teacherId', 'name avatar')
      .populate('courseId', 'title')
      .populate('participants', 'name')
      .sort({ scheduledAt: 1 })
      .limit(20);

    res.json({
      message: 'Upcoming live sessions retrieved successfully',
      data: liveSessions
    });
  } catch (error) {
    console.error('Error getting upcoming live sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Join live session
export const joinLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const liveSession = await LiveSession.findById(sessionId);
    if (!liveSession) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    // Check if session is full
    if (liveSession.participants.length >= liveSession.maxParticipants) {
      return res.status(400).json({ message: 'Live session is full' });
    }

    // Check if user is already a participant
    if (liveSession.participants.includes(userId)) {
      return res.status(400).json({ message: 'Already joined this session' });
    }

    // Add user to participants
    liveSession.participants.push(userId);
    await liveSession.save();

    res.json({
      message: 'Successfully joined live session',
      data: liveSession
    });
  } catch (error) {
    console.error('Error joining live session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Leave live session
export const leaveLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const liveSession = await LiveSession.findById(sessionId);
    if (!liveSession) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    // Remove user from participants
    liveSession.participants = liveSession.participants.filter(
      participant => participant.toString() !== userId
    );
    await liveSession.save();

    res.json({
      message: 'Successfully left live session',
      data: liveSession
    });
  } catch (error) {
    console.error('Error leaving live session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update live session status (Teacher only)
export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status, recordingUrl, notes } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update session status' });
    }

    const liveSession = await LiveSession.findById(sessionId);
    if (!liveSession) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    // Check if teacher owns this session
    if (liveSession.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: 'You can only update your own sessions' });
    }

    liveSession.status = status || liveSession.status;
    liveSession.recordingUrl = recordingUrl || liveSession.recordingUrl;
    liveSession.notes = notes || liveSession.notes;

    await liveSession.save();

    res.json({
      message: 'Session status updated successfully',
      data: liveSession
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get live session details
export const getLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const liveSession = await LiveSession.findById(sessionId)
      .populate('teacherId', 'name avatar')
      .populate('courseId', 'title')
      .populate('participants', 'name avatar');

    if (!liveSession) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    res.json({
      message: 'Live session retrieved successfully',
      data: liveSession
    });
  } catch (error) {
    console.error('Error getting live session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel live session (Teacher only)
export const cancelLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can cancel sessions' });
    }

    const liveSession = await LiveSession.findById(sessionId);
    if (!liveSession) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    // Check if teacher owns this session
    if (liveSession.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: 'You can only cancel your own sessions' });
    }

    // Check if session hasn't started yet
    if (liveSession.status !== 'scheduled') {
      return res.status(400).json({ message: 'Can only cancel scheduled sessions' });
    }

    liveSession.status = 'cancelled';
    await liveSession.save();

    res.json({
      message: 'Live session cancelled successfully',
      data: liveSession
    });
  } catch (error) {
    console.error('Error cancelling live session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 