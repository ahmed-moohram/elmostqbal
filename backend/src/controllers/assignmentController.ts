import { Request, Response } from 'express';
import { Assignment, AssignmentSubmission } from '../models/Assignment';
import { User } from '../models/User';
import Course from '../models/Course';

// Create new assignment (Teacher only)
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, dueDate, maxScore, instructions } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId || !courseId || !title || !description || !dueDate || !maxScore) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const assignment = new Assignment({
      courseId,
      title,
      description,
      dueDate: new Date(dueDate),
      maxScore,
      instructions,
      createdBy: teacherId
    });

    await assignment.save();

    res.status(201).json({
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get assignments for a course
export const getCourseAssignments = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const assignments = await Assignment.find({ courseId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Assignments retrieved successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get assignment details
export const getAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const assignment = await Assignment.findById(assignmentId)
      .populate('createdBy', 'name')
      .populate('courseId', 'title');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({
      message: 'Assignment retrieved successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit assignment (Student only)
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId, comments } = req.body;
    const studentId = req.user?.id;

    if (!studentId || !assignmentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user is student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit assignments' });
    }

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignmentId,
      studentId
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }

    // Check if due date has passed
    const isLate = new Date() > assignment.dueDate;

    const submission = new AssignmentSubmission({
      assignmentId,
      studentId,
      courseId: assignment.courseId,
      fileUrl: req.file?.path || '',
      fileName: req.file?.originalname || '',
      fileSize: req.file?.size || 0,
      comments,
      status: isLate ? 'late' : 'submitted'
    });

    await submission.save();

    res.status(201).json({
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get student's submissions
export const getStudentSubmissions = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const submissions = await AssignmentSubmission.find({ studentId })
      .populate('assignmentId', 'title dueDate maxScore')
      .populate('courseId', 'title')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      message: 'Submissions retrieved successfully',
      data: submissions
    });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get submissions for an assignment (Teacher only)
export const getAssignmentSubmissions = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can view submissions' });
    }

    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title maxScore')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      message: 'Submissions retrieved successfully',
      data: submissions
    });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Grade assignment (Teacher only)
export const gradeAssignment = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId || score === undefined || !feedback) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can grade assignments' });
    }

    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if score is valid
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (score < 0 || score > assignment.maxScore) {
      return res.status(400).json({ message: `Score must be between 0 and ${assignment.maxScore}` });
    }

    submission.score = score;
    submission.feedback = feedback;
    submission.gradedBy = teacherId;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await submission.save();

    res.json({
      message: 'Assignment graded successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update assignment (Teacher only)
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate, maxScore, instructions } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update assignments' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if teacher created this assignment
    if (assignment.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: 'You can only update your own assignments' });
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.dueDate = dueDate ? new Date(dueDate) : assignment.dueDate;
    assignment.maxScore = maxScore || assignment.maxScore;
    assignment.instructions = instructions || assignment.instructions;

    await assignment.save();

    res.json({
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete assignment (Teacher only)
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete assignments' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if teacher created this assignment
    if (assignment.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: 'You can only delete your own assignments' });
    }

    // Delete all submissions for this assignment
    await AssignmentSubmission.deleteMany({ assignmentId });

    // Delete the assignment
    await Assignment.findByIdAndDelete(assignmentId);

    res.json({
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 