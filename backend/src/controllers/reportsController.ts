import { Request, Response } from 'express';
import Course from '../models/Course';
import { User } from '../models/User';
import Payment from '../models/Payment';
import Order from '../models/Order';

export const getReports = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    // إحصائيات عامة
    const [
      totalCourses,
      totalStudents,
      totalTeachers,
      totalRevenue,
      recentPayments,
      topCourses
    ] = await Promise.all([
      Course.countDocuments(dateFilter),
      User.countDocuments({ ...dateFilter, role: 'student' }),
      User.countDocuments({ ...dateFilter, role: 'teacher' }),
      Payment.aggregate([
        { $match: { status: 'completed', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.find({ status: 'completed' })
        .sort({ paymentDate: -1 })
        .limit(10)
        .populate('user', 'name')
        .populate('course', 'title')
        .lean(),
      Course.find()
        .sort({ studentsCount: -1 })
        .limit(5)
        .select('title studentsCount rating')
        .lean()
    ]);

    res.json({
      summary: {
        totalCourses,
        totalStudents,
        totalTeachers,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentPayments,
      topCourses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error });
  }
};

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const salesByMonth = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalSales: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({ salesByMonth });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales report', error });
  }
};
