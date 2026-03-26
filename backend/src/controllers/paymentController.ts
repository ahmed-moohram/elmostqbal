import { Request, Response } from 'express';
import Payment from '../models/Payment';

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate as string);
      if (endDate) query.paymentDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email')
        .populate('course', 'title price')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};

export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment stats', error });
  }
};
