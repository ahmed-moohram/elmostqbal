import express from 'express';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { Achievement } from '../models/Achievement';
import { Device } from '../models/Device';
import { Section } from '../models/Section';
import { authMiddleware, isAdmin } from '../middleware/auth';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { User } from '../models/User';
import Course from '../models/Course';

const router = express.Router();

// Create enrollment request متاح للجميع (للطلاب)
router.post('/enrollment-requests', async (req, res) => {
  try {
    const { studentId, studentInfo, courseId, courseName, coursePrice, paymentInfo } = req.body;
    
    // التحقق من البيانات الأساسية
    if (!studentInfo || !courseId || !paymentInfo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // إنشاء الطلب
    const enrollmentRequest = new EnrollmentRequest({
      studentId: studentId || null,
      studentInfo: {
        name: studentInfo.name,
        email: studentInfo.email,
        phone: studentInfo.phone,
        parentPhone: studentInfo.parentPhone
      },
      courseId: courseId,
      paymentInfo: {
        method: paymentInfo.method || 'vodafone_cash',
        amount: paymentInfo.amount || coursePrice,
        receiptImage: paymentInfo.receiptImage || 'pending',
        phoneNumber: paymentInfo.phoneNumber
      },
      status: 'pending',
      submittedAt: new Date()
    });
    
    await enrollmentRequest.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'تم إرسال طلبك بنجاح',
      data: enrollmentRequest 
    });
  } catch (error: any) {
    console.error('Error creating enrollment request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// تطبيق الـ middleware على باقي الروابط
router.use(authMiddleware);
router.use(isAdmin);

// ==================== Statistics ====================
// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalStudents, 
      totalTeachers, 
      totalCourses,
      totalUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments(),
      User.countDocuments()
    ]);
    
    // حساب الكورسات النشطة (الطلاب المسجلين)
    const usersWithCourses = await User.countDocuments({ 
      role: 'student',
      enrolledCourses: { $exists: true, $ne: [] }
    });
    
    res.json({
      totalStudents,
      totalTeachers,
      totalCourses,
      totalUsers,
      activeEnrollments: usersWithCourses
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin statistics',
      message: error.message 
    });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { period = '1month' } = req.query;
    
    // تعريف الفترات الزمنية
    const periodMap: any = {
      '1day': { days: 1, intervals: 24, unit: 'hour' },
      '1week': { days: 7, intervals: 7, unit: 'day' },
      '2weeks': { days: 14, intervals: 14, unit: 'day' },
      '3weeks': { days: 21, intervals: 21, unit: 'day' },
      '1month': { days: 30, intervals: 30, unit: 'day' },
      '2months': { days: 60, intervals: 8, unit: 'week' },
      '3months': { days: 90, intervals: 12, unit: 'week' },
      '6months': { days: 180, intervals: 6, unit: 'month' },
      '1year': { days: 365, intervals: 12, unit: 'month' },
      '2years': { days: 730, intervals: 24, unit: 'month' },
      '3years': { days: 1095, intervals: 36, unit: 'month' },
      '5years': { days: 1825, intervals: 60, unit: 'month' }
    };
    
    const config = periodMap[period as string] || periodMap['1month'];
    const monthsData = [];
    
    for (let i = config.intervals - 1; i >= 0; i--) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i * Math.floor(config.days / config.intervals)));
      
      const studentsCount = await Student.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const enrollmentsCount = await EnrollmentRequest.countDocuments({
        submittedAt: { $gte: startDate, $lte: endDate },
        status: 'approved'
      });
      
      monthsData.push({
        month: startDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
        students: studentsCount,
        revenue: enrollmentsCount * 150
      });
    }
    
    res.json({ monthsData });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
  }
});

// Get recent orders
router.get('/orders', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const orders = await EnrollmentRequest.find()
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit as string));
    
    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderId: `#${order._id.toString().slice(-6).toUpperCase()}`,
      studentName: order.studentInfo?.name || 'غير معروف',
      studentAvatar: '/placeholder-avatar.png',
      courseName: 'دورة',
      date: order.submittedAt,
      amount: order.paymentInfo?.amount || 0,
      status: order.status
    }));
    
    res.json(formattedOrders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
  }
});

// Get popular courses
router.get('/courses/popular', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const courses = await Course.find()
      .select('title thumbnail enrolledCount price instructor')
      .sort({ enrolledCount: -1 })
      .limit(parseInt(limit as string));
    
    const formattedCourses = courses.map((course: any) => {
      const mainPrice = course.paymentOptions?.[0]?.price || 150;
      return {
        id: course._id,
        title: course.title,
        instructor: course.instructor || 'مدرس',
        thumbnail: course.thumbnail || '/placeholder-course.png',
        students: course.studentsCount || 0,
        rating: 4.5,
        revenue: (course.studentsCount || 0) * mainPrice
      };
    });
    
    res.json(formattedCourses);
  } catch (error: any) {
    console.error('Error fetching popular courses:', error);
    res.status(500).json({ error: 'Failed to fetch popular courses', message: error.message });
  }
});

// Get recent students
router.get('/students/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const students = await Student.find()
      .select('name email phone grade courses createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));
    
    const formattedStudents = students.map((student: any) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      avatar: '/placeholder-avatar.png',
      joinDate: student.createdAt,
      enrolledCourses: Array.isArray(student.courses) ? student.courses.length : 0
    }));
    
    res.json(formattedStudents);
  } catch (error: any) {
    console.error('Error fetching recent students:', error);
    res.status(500).json({ error: 'Failed to fetch recent students', message: error.message });
  }
});

// ==================== Enrollment Requests ====================

// Get all enrollment requests
router.get('/enrollments', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const requests = await EnrollmentRequest.find(query)
      .populate('studentId', 'name email phone')
      .populate('courseId', 'title thumbnail')
      .sort({ submittedAt: -1 });
    
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get enrollment requests (بدون middleware للطلاب)
router.get('/enrollment-requests', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const requests = await EnrollmentRequest.find(query)
      .populate('studentId', 'name studentPhone parentPhone')
      .populate('courseId', 'title thumbnail')
      .sort({ submittedAt: -1 });
    
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve enrollment request
router.post('/enrollments/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    const enrollment = await EnrollmentRequest.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.user?._id,
        approvalMessage: message
      },
      { new: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment request not found' });
    }
    
    // TODO: Add student to course
    
    try {
      // التأكد من وجود سجل للطالب
      let student = await Student.findById(enrollment.studentId);
      if (!student && enrollment.studentInfo?.phone) {
        student = await Student.findOne({ phone: enrollment.studentInfo.phone });
      }

      if (!student && enrollment.studentInfo) {
        student = new Student({
          name: enrollment.studentInfo.name,
          email: enrollment.studentInfo.email,
          phone: enrollment.studentInfo.phone,
          parentPhone: enrollment.studentInfo.parentPhone,
          grade: 'غير محدد',
          courses: []
        });
      }

      if (student) {
        const courseId = enrollment.courseId;

        // إضافة الكورس إلى قائمة كورسات الطالب إذا لم يكن مضافًا
        const hasCourse = Array.isArray(student.courses)
          ? student.courses.some(
              (c: any) => c.courseId?.toString() === courseId.toString()
            )
          : false;

        if (!hasCourse) {
          (student.courses as any[]).push({
            courseId,
            progress: 0,
            completedLessons: [],
            lastAccessed: new Date()
          });
        }

        await student.save();

        // إضافة الطالب إلى الكورس
        const course = await Course.findById(courseId);
        if (course) {
          const isAlreadyStudent = Array.isArray(course.students)
            ? course.students.some(
                (s: any) => s.toString() === student!._id.toString()
              )
            : false;

          if (!isAlreadyStudent) {
            (course.students as any[]).push(student._id);
            course.studentsCount = (course.studentsCount || 0) + 1;
            await course.save();
          }
        }

        // إنشاء إنجاز للطالب عند الاشتراك في الكورس
        try {
          await Achievement.create({
            studentId: student._id,
            courseId,
            type: 'milestone_reached',
            title: 'انضمام إلى الكورس',
            description: 'تم تسجيل الطالب في الكورس بنجاح',
            points: 10,
            metadata: {
              grade: (student as any).grade
            },
            earnedAt: new Date(),
            isVisible: true
          });
        } catch (achievementError) {
          console.error('Error creating enrollment achievement:', achievementError);
        }
      }
    } catch (linkError) {
      console.error('Error linking student with course on approval:', linkError);
    }
    
    res.json({ success: true, data: enrollment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject enrollment request
router.post('/enrollments/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const enrollment = await EnrollmentRequest.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: req.user?._id,
        rejectionReason: reason
      },
      { new: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment request not found' });
    }
    
    res.json({ success: true, data: enrollment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Achievements ====================

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate('studentId', 'name email phone')
      .populate('courseId', 'title')
      .sort({ earnedAt: -1 });
    
    res.json({ success: true, data: achievements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get achievements by student
router.get('/achievements/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const achievements = await Achievement.find({ studentId })
      .populate('courseId', 'title')
      .sort({ earnedAt: -1 });
    
    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    
    res.json({ 
      success: true, 
      data: {
        achievements,
        totalPoints,
        count: achievements.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create achievement
router.post('/achievements', async (req, res) => {
  try {
    const achievement = new Achievement(req.body);
    await achievement.save();
    
    res.status(201).json({ success: true, data: achievement });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Devices ====================

// Get all devices
router.get('/devices', async (req, res) => {
  try {
    const { studentId, isBlocked } = req.query;
    
    let query: any = {};
    if (studentId) query.studentId = studentId;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
    
    const devices = await Device.find(query)
      .populate('studentId', 'name email phone')
      .sort({ lastActive: -1 });
    
    res.json({ success: true, data: devices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Block device
router.post('/devices/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const device = await Device.findByIdAndUpdate(
      id,
      { 
        isBlocked: true,
        blockedReason: reason
      },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    res.json({ success: true, data: device });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unblock device
router.post('/devices/:id/unblock', async (req, res) => {
  try {
    const { id } = req.params;
    
    const device = await Device.findByIdAndUpdate(
      id,
      { 
        isBlocked: false,
        blockedReason: undefined
      },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    res.json({ success: true, data: device });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Sections & Videos ====================

// Get sections by course
router.get('/sections', async (req, res) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ success: false, error: 'courseId is required' });
    }
    
    const sections = await Section.find({ courseId })
      .sort({ order: 1 });
    
    res.json({ success: true, data: sections });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create section
router.post('/sections', async (req, res) => {
  try {
    const section = new Section(req.body);
    await section.save();
    
    res.status(201).json({ success: true, data: section });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update section
router.put('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const section = await Section.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }
    
    res.json({ success: true, data: section });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete section
router.delete('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const section = await Section.findByIdAndDelete(id);
    
    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }
    
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add video to section
router.post('/sections/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    
    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }
    
    section.videos.push(req.body);
    await section.save();
    
    res.status(201).json({ success: true, data: section });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update video
router.put('/videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const section = await Section.findOne({ 'videos._id': videoId });
    if (!section) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }
    
    const videoIndex = section.videos.findIndex((v: any) => v._id?.toString() === videoId);
    if (videoIndex !== -1) {
      section.videos[videoIndex] = { ...section.videos[videoIndex], ...req.body };
      await section.save();
    }
    
    res.json({ success: true, data: section });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete video
router.delete('/videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const section = await Section.findOne({ 'videos._id': videoId });
    if (!section) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }
    
    section.videos = section.videos.filter((v: any) => v._id?.toString() !== videoId);
    await section.save();
    
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
