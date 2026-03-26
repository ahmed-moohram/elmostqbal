import { Request, Response } from 'express';
import Order from '../models/Order';

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('courses', 'title price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderNumber = `ORD-${Date.now()}`;
    const order = new Order({
      ...req.body,
      orderNumber,
      user: req.user?._id
    });

    await order.save();
    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error });
  }
};
