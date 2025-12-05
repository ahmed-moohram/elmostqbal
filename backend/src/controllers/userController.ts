import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // جلب جميع المستخدمين مع جميع البيانات المهمة
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password') // استبعاد كلمة المرور فقط
      .populate('enrolledCourses', 'title')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('name email avatar')
      .sort({ name: 1 });

    res.json({
      message: 'Teachers retrieved successfully',
      data: teachers
    });
  } catch (error) {
    console.error('Error getting teachers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    // جلب جميع الطلاب مع جميع بياناتهم (ما عدا كلمة المرور)
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('enrolledCourses', 'title thumbnail price')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Students retrieved successfully',
      data: students
    });
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, specialty, password } = req.body;

    // Check if teacher already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'المدرس موجود بالفعل' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new teacher
    const teacher = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'teacher',
      specialty
    });

    await teacher.save();

    res.status(201).json({
      message: 'تم إضافة المدرس بنجاح',
      data: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        specialty: teacher.specialty
      }
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة المدرس' });
  }
};

export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, specialty } = req.body;

    const teacher = await User.findByIdAndUpdate(
      id,
      { name, email, phone, specialty },
      { new: true }
    ).select('name email phone specialty');

    if (!teacher) {
      return res.status(404).json({ message: 'المدرس غير موجود' });
    }

    res.json({
      message: 'تم تحديث بيانات المدرس بنجاح',
      data: teacher
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث بيانات المدرس' });
  }
};

export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const teacher = await User.findByIdAndDelete(id);

    if (!teacher) {
      return res.status(404).json({ message: 'المدرس غير موجود' });
    }

    res.json({ message: 'تم حذف المدرس بنجاح' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المدرس' });
  }
}; 