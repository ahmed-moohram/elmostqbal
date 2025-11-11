import { Request, Response } from 'express';
import Certificate from '../models/Certificate';
import { User } from '../models/User';
import Course from '../models/Course';

// Issue certificate for course completion
export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const { courseId, studentId, grade } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId || !courseId || !studentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user is teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can issue certificates' });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      studentId,
      courseId
    });

    if (existingCertificate) {
      return res.status(400).json({ message: 'Certificate already issued for this course' });
    }

    const certificate = new Certificate({
      studentId,
      courseId,
      completionDate: new Date(),
      grade: grade || null
    });

    await certificate.save();

    // Populate student and course details
    await certificate.populate('studentId', 'name');
    await certificate.populate('courseId', 'title');

    res.status(201).json({
      message: 'Certificate issued successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get student's certificates
export const getStudentCertificates = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const certificates = await Certificate.find({ studentId })
      .populate('courseId', 'title description image')
      .sort({ issueDate: -1 });

    res.json({
      message: 'Certificates retrieved successfully',
      data: certificates
    });
  } catch (error) {
    console.error('Error getting certificates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get certificate by ID
export const getCertificate = async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const certificate = await Certificate.findById(certificateId)
      .populate('studentId', 'name email')
      .populate('courseId', 'title description');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user is authorized to view this certificate
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin' && user.role !== 'teacher' && certificate.studentId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this certificate' });
    }

    res.json({
      message: 'Certificate retrieved successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Error getting certificate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify certificate by number
export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({ certificateNumber })
      .populate('studentId', 'name email')
      .populate('courseId', 'title description');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.status !== 'issued') {
      return res.status(400).json({ message: 'Certificate is not valid' });
    }

    res.json({
      message: 'Certificate verified successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all certificates (Admin/Teacher only)
export const getAllCertificates = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const certificates = await Certificate.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Certificate.countDocuments();

    res.json({
      message: 'Certificates retrieved successfully',
      data: {
        certificates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting certificates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Revoke certificate (Admin only)
export const revokeCertificate = async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can revoke certificates' });
    }

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    certificate.status = 'revoked';
    await certificate.save();

    res.json({
      message: 'Certificate revoked successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Download certificate
export const downloadCertificate = async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const certificate = await Certificate.findById(certificateId)
      .populate('studentId', 'name')
      .populate('courseId', 'title');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user is authorized to download this certificate
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const studentId = (certificate.studentId as any)._id?.toString() || certificate.studentId.toString();
    if (user.role !== 'admin' && user.role !== 'teacher' && studentId !== userId) {
      return res.status(403).json({ message: 'Not authorized to download this certificate' });
    }

    // Generate certificate PDF (this would be implemented with a PDF library)
    // For now, return certificate data
    res.json({
      message: 'Certificate download initiated',
      data: {
        certificateNumber: certificate.certificateNumber,
        studentName: (certificate.studentId as any).name,
        courseTitle: (certificate.courseId as any).title,
        issueDate: certificate.issueDate,
        completionDate: certificate.completionDate,
        grade: certificate.grade
      }
    });
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};