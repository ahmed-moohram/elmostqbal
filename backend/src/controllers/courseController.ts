import { Request, Response } from 'express';
import Course from '../models/Course';
import { User } from '../models/User';

export const createCourse = async (req: Request, res: Response) => {
  try {
    console.log('\n========================================');
    console.log('[CREATE COURSE] START');
    console.log('========================================');
    console.log('[USER]', req.user?.email, 'ID:', req.user?._id);
    console.log('[REQUEST BODY]', JSON.stringify(req.body, null, 2));
    console.log('[SECTIONS COUNT]', req.body.sections?.length || 0);
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // التحقق من البيانات الأساسية
    if (!req.body.title) {
      console.log('❌ Missing title');
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!req.body.sections || req.body.sections.length === 0) {
      console.log('❌ No sections provided');
      return res.status(400).json({ message: 'At least one section is required' });
    }
    
    console.log('[CREATING] Course instance...');
    const courseData = {
      ...req.body,
      instructor: req.user._id,
    };
    
    console.log('[COURSE DATA]', JSON.stringify(courseData, null, 2));
    
    const course = new Course(courseData);

    console.log('[SAVING] Saving course to DB...');
    await course.save();
    
    console.log('[SUCCESS] Course created successfully:', course._id);
    console.log('========================================\n');
    res.status(201).json({ course, message: 'تم إنشاء الدورة بنجاح' });
  } catch (error: any) {
    console.error('\n========================================');
    console.error('[ERROR] CREATING COURSE');
    console.error('========================================');
    console.error('[ERROR NAME]', error.name);
    console.error('[ERROR MESSAGE]', error.message);
    console.error('[ERROR STACK]', error.stack);
    
    if (error.errors) {
      console.error('\n[VALIDATION ERRORS]');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}:`, error.errors[key].message);
        console.error(`    Value:`, error.errors[key].value);
      });
    }
    console.error('========================================\n');
    
    res.status(500).json({ 
      message: 'Error creating course', 
      error: error.message,
      validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })) : []
    });
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    console.log('\n[GET COURSES] START');
    console.log('[USER]', req.user?.email || 'غير مسجل', 'Role:', req.user?.role || 'guest');
    
    const { category, isFree, search, page = 1, limit = 20, isFeatured } = req.query;
    
    // للأدمن: عرض كل الدورات (منشورة وغير منشورة)
    // للمستخدمين العاديين: فقط الدورات المنشورة
    const isAdmin = req.user?.role === 'admin';
    console.log('[IS ADMIN]', isAdmin);
    
    const query: any = { 
      isActive: true // فقط الدورات النشطة
    };
    
    // إضافة filter للدورات المنشورة فقط للمستخدمين العاديين
    if (!isAdmin) {
      query.isPublished = true;
      console.log('[FILTER] فقط الدورات المنشورة');
    } else {
      console.log('[FILTER] كل الدورات النشطة');
    }
    
    console.log('[QUERY]', JSON.stringify(query));

    if (category) query.category = category;
    if (isFree) query.isFree = isFree === 'true';
    if (isFeatured) query.isFeatured = isFeatured === 'true';
    if (search) {
      query.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);
    console.log('[PAGINATION] page:', page, 'limit:', limit, 'skip:', skip);

    // Test direct query first
    console.log('[TEST] Testing direct countDocuments...');
    const testCount = await Course.countDocuments({ isActive: true });
    console.log('[TEST] Direct count with isActive=true:', testCount);

    // استعلامات متوازية
    console.log('[EXECUTING] Mongoose query with:', JSON.stringify(query));
    const [courses, total] = await Promise.all([
      Course.find(query)
        .select('title description price thumbnail category rating studentsCount isPublished isActive paymentOptions instructor') // حقول فقط
        // .populate('instructor', 'name')  // ← تعطيل populate مؤقتاً
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(), // أسرع بـ 5x
      Course.countDocuments(query)
    ]);

    console.log(`[FOUND] ${courses.length} courses (Total in DB: ${total})`);
    
    // إضافة price من paymentOptions إذا لم يكن موجود
    const coursesWithPrice = courses.map((course: any) => {
      if (!course.price && course.paymentOptions && course.paymentOptions.length > 0) {
        course.price = course.paymentOptions[0].price;
      }
      return course;
    });
    
    if (coursesWithPrice.length > 0) {
      console.log('[FIRST COURSE]', {
        title: coursesWithPrice[0].title,
        isPublished: coursesWithPrice[0].isPublished,
        price: coursesWithPrice[0].price,
        paymentOptions: coursesWithPrice[0].paymentOptions
      });
    }
    console.log('[GET COURSES] END\n');

    // ✅ تحديث فوري: بدون Cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    res.json({ 
      courses: coursesWithPrice,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error });
  }
};

export const getCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email bio')
      .populate('reviews.userId', 'name')
      .lean(); // أسرع بـ 5x

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // إضافة cache headers
    res.set('Cache-Control', 'public, max-age=180'); // 3 دقائق
    res.set('ETag', `"${req.params.id}-${Date.now()}"`);

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    console.log('[UPDATE COURSE] START');
    console.log('[COURSE ID]', req.params.id);
    console.log('[USER]', req.user?.email, 'Role:', req.user?.role);
    console.log('[UPDATES]', Object.keys(req.body));
    
    const course = await Course.findById(req.params.id);

    if (!course) {
      console.log('[ERROR] Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('[COURSE]', course.title);
    console.log('[INSTRUCTOR]', course.instructor);

    // Check authorization - allow admin or course owner
    if (!req.user) {
      console.log('[ERROR] No user');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const isAdmin = req.user.role === 'admin';
    const isOwner = course.instructor.toString() === req.user._id.toString();
    
    console.log('[IS ADMIN]', isAdmin);
    console.log('[IS OWNER]', isOwner);
    
    if (!isAdmin && !isOwner) {
      console.log('[ERROR] Not authorized');
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    // Update course
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'description', 'shortDescription', 'price', 'isFree', 'thumbnail', 'category', 'level', 'language', 'sections', 'isPublished', 'paymentOptions'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      console.log('[ERROR] Invalid updates:', updates.filter(u => !allowedUpdates.includes(u)));
      return res.status(400).json({ message: 'Invalid updates' });
    }

    console.log('[APPLYING] Updates...');
    updates.forEach((update) => {
      (course as any)[update] = req.body[update];
    });

    await course.save();
    console.log('[SUCCESS] Course updated');
    res.json({ course });
  } catch (error) {
    console.error('[ERROR] Update course:', error);
    res.status(500).json({ message: 'Error updating course', error });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    console.log('🗑️ Delete Course - START');
    console.log('Course ID:', req.params.id);
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    
    const course = await Course.findById(req.params.id);

    if (!course) {
      console.log('❌ Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('📚 Course found:', course.title);
    console.log('👤 Instructor:', course.instructor);

    // السماح للأدمن أو صاحب الدورة بالحذف
    if (!req.user) {
      console.log('❌ No user');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const isAdmin = req.user.role === 'admin';
    const isOwner = course.instructor.toString() === req.user._id.toString();
    
    console.log('🔍 isAdmin:', isAdmin);
    console.log('🔍 isOwner:', isOwner);
    
    if (!isAdmin && !isOwner) {
      console.log('❌ Not authorized');
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // ✅ Soft delete: تعيين isActive = false بدلاً من الحذف النهائي
    console.log('💾 Setting isActive = false');
    course.isActive = false;
    await course.save();
    
    console.log('✅ Course deleted successfully');
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting course:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
};

export const enrollInCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if ((course as any).isFree || req.user.role === 'admin') {
      // Enroll in free course or admin enrollment
      const user = await User.findById(req.user._id);
      if (user && (user as any).enrolledCourses && !(user as any).enrolledCourses.includes(course._id)) {
        (user as any).enrolledCourses.push(course._id);
        course.studentsCount = (course.studentsCount || 0) + 1;
        await Promise.all([user.save(), course.save()]);
      }
      return res.json({ message: 'Successfully enrolled in course' });
    }

    // Handle paid course enrollment (requires payment)
    // This would typically involve Stripe integration
    res.status(402).json({ message: 'Payment required for enrollment' });
  } catch (error) {
    res.status(500).json({ message: 'Error enrolling in course', error });
  }
};

export const addReview = async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const review = {
      userId: req.user._id,
      rating: Number(rating),
      comment: String(comment),
      createdAt: new Date(),
      likes: 0,
      isVerifiedPurchase: true
    };

    course.reviews.push(review);

    // Update course rating
    const totalRating = course.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    course.rating = totalRating / course.reviews.length;

    await course.save();
    res.json({ message: 'Review added successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error });
  }
};

// Get enrolled courses for current user
export const getEnrolledCourses = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id).populate({
      path: 'enrolledCourses',
      select: 'title thumbnail instructor sections rating studentsCount',
      populate: {
        path: 'instructor',
        select: 'name'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format courses with progress information
    const enrolledCourses = (user as any).enrolledCourses.map((course: any) => {
      const totalVideos = course.sections?.reduce((sum: number, section: any) => 
        sum + (section.lessons?.length || 0), 0) || 0;
      
      return {
        id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        instructor: course.instructor?.name || 'Unknown',
        totalVideos,
        completedVideos: 0, // TODO: Track actual progress
        progress: 0, // TODO: Calculate from user progress
        rating: course.rating,
        studentsCount: (course as any).studentsCount
      };
    });

    res.json({ courses: enrolledCourses });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses', error });
  }
}; 