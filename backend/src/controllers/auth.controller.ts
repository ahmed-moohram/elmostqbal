import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register a new user

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, fatherName, studentPhone, parentPhone, password, role } = req.body;

    // Required fields validation
    if (!name || !fatherName || !studentPhone || !parentPhone || !password) {
      res.status(400).json({ message: 'جميع الحقول مطلوبة' });
      return;
    }

    // Validate name (at least 3 parts)
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 3) {
      res.status(400).json({ message: 'يجب إدخال الاسم رباعي كامل (ثلاث خانات على الأقل)' });
      return;
    }

    // Validate father name (at least 2 parts)
    const fatherNameParts = fatherName.trim().split(/\s+/);
    if (fatherNameParts.length < 2) {
      res.status(400).json({ message: 'يجب إدخال اسم الأب كاملاً (كلمتين على الأقل)' });
      return;
    }

    // Validate phone number format (must start with 01 and be 11 digits)
    if (!/^01\d{9}$/.test(studentPhone)) {
      res.status(400).json({ message: 'رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم' });
      return;
    }
    
    // Validate parent phone number format
    if (!/^01\d{9}$/.test(parentPhone)) {
      res.status(400).json({ message: 'رقم هاتف ولي الأمر يجب أن يبدأ بـ 01 ويتكون من 11 رقم' });
      return;
    }

    // Validate phones are different
    if (studentPhone === parentPhone) {
      res.status(400).json({ message: 'رقم ولي الأمر يجب أن يكون مختلفاً عن رقم الطالب' });
      return;
    }

    // Validate password (at least 4 chars, 1 number, and a symbol)
    if (!/^(?=.*[0-9])(?=.*[#@$])(?=.{4,})/.test(password)) {
      res.status(400).json({ message: 'كلمة المرور يجب أن تحتوي على 4 أحرف على الأقل ورقم ورمز خاص (#،@،$)' });
      return;
    }

    // Check if user already exists with the same phone
    const userExists = await User.findOne({ studentPhone });
    if (userExists) {
      res.status(400).json({ message: 'هذا الرقم مُسجل مسبقاً' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      fatherName,
      studentPhone,
      parentPhone,
      password: hashedPassword,
      role: role || 'student', // Default role is student
    });

    await user.save();

    // If the user is a student or teacher, create the corresponding profile
    if (role === 'student') {
      const student = new Student({
        user: user._id,
        name,
        phone: studentPhone,
      });
      await student.save();
    } else if (role === 'teacher') {
      const teacher = new Teacher({
        user: user._id,
        name,
        phone: studentPhone,
        bio: '',
        subjects: [],
      });
      await teacher.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      message: 'تم إنشاء الحساب بنجاح',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'حدث خطأ في إنشاء الحساب' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔐 محاولة تسجيل دخول:', req.body.studentPhone);
    const { studentPhone, password } = req.body;

    // التحقق من المدخلات
    if (!studentPhone || !password) {
      res.status(400).json({ message: 'رقم الهاتف وكلمة المرور مطلوبان' });
      return;
    }

    // Check for user by phone with timeout
    const user = await User.findOne({ studentPhone })
      .maxTimeMS(5000) // حد أقصى 5 ثواني
      .lean();
      
    if (!user) {
      console.log('❌ مستخدم غير موجود:', studentPhone);
      res.status(400).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
      return;
    }

    console.log('✅ تم العثور على المستخدم:', user.name);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ كلمة مرور خاطئة');
      res.status(400).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
      return;
    }

    console.log('✅ كلمة المرور صحيحة');

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ تم إنشاء Token بنجاح');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        studentPhone: user.studentPhone,
        image: user.image || '/placeholder-profile.jpg',
      },
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: 'حدث خطأ في تسجيل الدخول' });
  }
};

// Login with phone
export const loginWithPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentPhone, password } = req.body;

    // Check for user with phone
    const user = await User.findOne({ studentPhone });
    if (!user) {
      res.status(400).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        image: user.image || '/placeholder-profile.jpg',
      },
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch (error) {
    console.error('Login with phone error:', error);
    res.status(500).json({ message: 'حدث خطأ في تسجيل الدخول' });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'لم يتم العثور على المستخدم' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب بيانات المستخدم' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, image } = req.body;
    
    const updateData: {
      name?: string;
      email?: string;
      phone?: string;
      image?: string;
    } = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (image) updateData.image = image;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'لم يتم العثور على المستخدم' });
      return;
    }

    // Update related profile (student or teacher)
    if (user.role === 'student') {
      await Student.findOneAndUpdate(
        { user: user._id },
        { $set: { name: name || undefined, phone: phone || undefined } }
      );
    } else if (user.role === 'teacher') {
      await Teacher.findOneAndUpdate(
        { user: user._id },
        { $set: { name: name || undefined, phone: phone || undefined } }
      );
    }

    res.json({
      user,
      message: 'تم تحديث الملف الشخصي بنجاح',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'حدث خطأ في تحديث الملف الشخصي' });
  }
}; 
