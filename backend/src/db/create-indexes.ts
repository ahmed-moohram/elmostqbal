/**
 * هذا الملف يقوم بإنشاء فهارس متقدمة لتحسين أداء الاستعلامات
 * يجب تشغيله مرة واحدة عند بدء التطبيق
 */

import mongoose from 'mongoose';
import Course from '../models/Course';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { User } from '../models/User';
import { Book } from '../models/Book';

export async function createIndexes() {
  console.log('بدء إنشاء الفهارس...');
  
  try {
    // فهارس User
    await User.collection.createIndex({ studentPhone: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ role: 1 }, { background: true });
    await User.collection.createIndex(
      { name: 'text', fatherName: 'text' }, 
      { weights: { name: 10, fatherName: 5 }, background: true }
    );
    
    // فهارس Course
    await Course.collection.createIndex({ title: 1 }, { background: true });
    await Course.collection.createIndex({ category: 1, level: 1 }, { background: true });
    await Course.collection.createIndex({ instructor: 1 }, { background: true });
    await Course.collection.createIndex({ isActive: 1, isFeatured: 1 }, { background: true });
    await Course.collection.createIndex({ rating: -1, studentsCount: -1 }, { background: true }); // للترتيب حسب التقييم والشعبية
    await Course.collection.createIndex(
      { title: 'text', description: 'text', shortDescription: 'text', tags: 'text' }, 
      { weights: { title: 10, shortDescription: 5, description: 3, tags: 7 }, background: true }
    );
    
    // فهارس Student
    await Student.collection.createIndex({ phone: 1 }, { unique: true, background: true });
    await Student.collection.createIndex({ 'courses.courseId': 1 }, { background: true });
    
    // فهارس Teacher
    await Teacher.collection.createIndex({ phone: 1 }, { unique: true, background: true });
    await Teacher.collection.createIndex({ specialization: 1 }, { background: true });
    
    // فهارس Book
    await Book.collection.createIndex({ author: 1, category: 1 }, { background: true });
    await Book.collection.createIndex({ rating: -1, purchases: -1 }, { background: true });
    
    console.log('تم إنشاء جميع الفهارس بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في إنشاء الفهارس:', error);
    return false;
  }
} 