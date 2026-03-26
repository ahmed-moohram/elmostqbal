import { Request, Response } from 'express';
import Rating, { IRating } from '../models/Rating';
import { User } from '../models/User';
import Course from '../models/Course';

export const addRating = async (req: Request, res: Response) => {
  try {
    const { targetType, targetId, rating, review } = req.body;
    const userId = req.user?.id;

    if (!userId || !targetType || !targetId || !rating || !review) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if target exists
    if (targetType === 'course') {
      const course = await Course.findById(targetId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
    } else if (targetType === 'teacher') {
      const teacher = await User.findById(targetId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }
    }

    // Check if user already rated this target
    const existingRating = await Rating.findOne({
      user: userId,
      targetType,
      targetId
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this item' });
    }

    const newRating = new Rating({
      user: userId,
      targetType,
      targetId,
      rating,
      review
    });

    await newRating.save();

    // Populate user details
    await newRating.populate('user', 'name avatar');

    res.status(201).json({
      message: 'Rating added successfully',
      data: newRating
    });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRating = async (req: Request, res: Response) => {
  try {
    const { ratingId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user?.id;

    if (!userId || !rating || !review) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existingRating = await Rating.findOne({
      _id: ratingId,
      user: userId
    });

    if (!existingRating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    existingRating.rating = rating;
    existingRating.review = review;
    await existingRating.save();

    // Populate user details
    await existingRating.populate('user', 'name avatar');

    res.json({
      message: 'Rating updated successfully',
      data: existingRating
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRatings = async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ targetType, targetId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Rating.countDocuments({ targetType, targetId });

    // Calculate average rating
    const avgRating = await Rating.aggregate([
      { $match: { targetType, targetId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const averageRating = avgRating.length > 0 ? avgRating[0].avgRating : 0;

    // Get rating distribution
    const ratingDistribution = await Rating.aggregate([
      { $match: { targetType, targetId } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      message: 'Ratings retrieved successfully',
      data: {
        ratings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        totalRatings: total
      }
    });
  } catch (error) {
    console.error('Error getting ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserRating = async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rating = await Rating.findOne({
      user: userId,
      targetType,
      targetId
    });

    res.json({
      message: 'User rating retrieved successfully',
      data: rating
    });
  } catch (error) {
    console.error('Error getting user rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRating = async (req: Request, res: Response) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rating = await Rating.findOneAndDelete({
      _id: ratingId,
      user: userId
    });

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    res.json({
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 