import { Request, Response } from 'express';
import { Device } from '../models/Device';

export const getDevices = async (req: Request, res: Response) => {
  try {
    const { studentId, isBlocked } = req.query;
    const query: any = {};

    if (studentId) query.studentId = studentId;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';

    const devices = await Device.find(query)
      .populate('studentId', 'name email')
      .sort({ lastActive: -1 })
      .lean();

    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching devices', error });
  }
};

export const blockDevice = async (req: Request, res: Response) => {
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

    res.json({ device, message: 'Device blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking device', error });
  }
};

export const unblockDevice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const device = await Device.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
        blockedReason: null
      },
      { new: true }
    );

    res.json({ device, message: 'Device unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking device', error });
  }
};
