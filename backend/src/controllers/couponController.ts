import { Request, Response } from 'express';
import Coupon from '../models/Coupon';

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate('applicableCourses', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Coupon.countDocuments(query)
    ]);

    res.json({
      coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ coupon });
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found or inactive' });
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: 'Coupon expired' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    res.json({ coupon, valid: true });
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon', error });
  }
};
