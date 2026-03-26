import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from '../config';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

/**
 * تهيئة مجلدات الرفع
 */
const initializeUploadDirs = () => {
  try {
    // إنشاء جميع مجلدات الرفع إذا لم تكن موجودة
    const dirs = [
      config.uploads.idDocsPath,
      config.uploads.profilesPath,
      config.uploads.coursesPath,
      config.uploads.booksPath
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 تم إنشاء مجلد ${dir}`);
      }
    }
    
    console.log('✅ تم تهيئة مجلدات الرفع بنجاح');
  } catch (error) {
    console.error('❌ خطأ في تهيئة مجلدات الرفع:', error);
  }
};

/**
 * إصلاح الـ indexes القديمة
 */
const fixOldIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    
    const coursesCollection = db.collection('courses');
    
    // حذف الـ text index القديم الذي يسبب مشاكل مع اللغة العربية
    try {
      await coursesCollection.dropIndex('title_text_description_text_category_text_tags_text');
      console.log('✅ تم حذف text index القديم');
    } catch (err: any) {
      // Index لا يوجد أو تم حذفه مسبقاً
      if (err.code !== 27) { // 27 = IndexNotFound
        console.log('ℹ️ Text index غير موجود (تم حذفه مسبقاً)');
      }
    }
  } catch (error) {
    console.log('ℹ️ تخطي إصلاح indexes');
  }
};

/**
 * Initialize the database with necessary data
 */
export const initializeDatabase = async () => {
  try {
    console.log('🔄 جاري تهيئة قاعدة البيانات...');
    
    // تهيئة مجلدات الرفع
    initializeUploadDirs();
    
    // إصلاح الـ indexes القديمة
    await fixOldIndexes();
    
    // Check for existing admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (!existingAdmin) {
      console.log('👤 جاري إنشاء حساب المدير...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(config.admin.defaultPassword, salt);
      
      // Create admin account
      const admin = new User({
        name: 'مستر معتصم',
        fatherName: 'المدير',
        studentPhone: '01062000000',
        parentPhone: '01062111111',
        email: 'admin@edufutura.com',
        password: hashedPassword,
        role: 'admin',
        image: '/admin-profile.jpg',
        profilePicture: '/admin-profile.jpg',
        isVerified: true
      });
      
      await admin.save();
      console.log('✅ تم إنشاء حساب المدير بنجاح');
    } else {
      console.log('ℹ️ حساب المدير موجود بالفعل');
    }
    
    console.log('✅ تمت تهيئة قاعدة البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    return false;
  }
};

/**
 * Connect to MongoDB
 */
export const connectDB = async () => {
  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات MongoDB...');
    
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    
    console.log('✅ تم الاتصال بنجاح بقاعدة بيانات MongoDB');
    
    // Initialize database with required data
    await initializeDatabase();
    
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة بيانات MongoDB:', error);
    return false;
  }
}; 