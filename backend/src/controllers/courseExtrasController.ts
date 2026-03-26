import { Request, Response } from 'express';
import Course from '../models/Course';
import { Section } from '../models/Section';

// Get course content (sections and lessons)
export const getCourseContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const sections = await Section.find({ courseId: id, isPublished: true })
      .sort({ order: 1 })
      .lean();
    
    res.json({ content: sections });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course content', error });
  }
};

// Get course reviews
export const getCourseReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const course = await Course.findById(id)
      .populate('reviews.userId', 'name image')
      .lean();
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const reviews = course.reviews || [];
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedReviews = reviews.slice(skip, skip + Number(limit));
    
    res.json({
      reviews: paginatedReviews,
      total: reviews.length,
      page: Number(page),
      pages: Math.ceil(reviews.length / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
};

// Get recommended courses
export const getRecommendedCourses = async (req: Request, res: Response) => {
  try {
    const { userId, category, limit = 6 } = req.query;
    
    let query: any = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    const courses = await Course.find(query)
      .sort({ rating: -1, studentsCount: -1 })
      .limit(Number(limit))
      .select('title thumbnail instructor rating studentsCount price')
      .populate('instructor', 'name')
      .lean();
    
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommended courses', error });
  }
};

// Get teacher dashboard data
export const getTeacherDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const teacherId = req.user._id;
    
    // Get teacher's courses
    const courses = await Course.find({ instructor: teacherId })
      .select('title studentsCount rating')
      .lean();
    
    const totalStudents = courses.reduce((sum, course: any) => sum + (course.studentsCount || 0), 0);
    const averageRating = courses.length > 0 
      ? courses.reduce((sum, course: any) => sum + (course.rating || 0), 0) / courses.length 
      : 0;
    
    res.json({
      dashboard: {
        totalCourses: courses.length,
        totalStudents,
        averageRating: averageRating.toFixed(1),
        courses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher dashboard', error });
  }
};
