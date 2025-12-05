const mongoose = require('mongoose');

// الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';

async function fixIndexes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');

    console.log('🔍 Checking existing indexes...');
    const indexes = await coursesCollection.indexes();
    console.log('Current indexes:', indexes);

    // حذف جميع الـ text indexes القديمة
    console.log('🗑️ Dropping old text indexes...');
    try {
      await coursesCollection.dropIndex('title_text_description_text_category_text_tags_text');
      console.log('✅ Dropped old text index');
    } catch (err) {
      console.log('ℹ️ No old index to drop (or already dropped)');
    }

    // إنشاء الـ index الجديد
    console.log('🔨 Creating new text index...');
    await coursesCollection.createIndex(
      { 
        title: 'text', 
        description: 'text', 
        category: 'text', 
        tags: 'text' 
      }, 
      { 
        default_language: 'none',
        language_override: 'language',
        name: 'course_text_search'
      }
    );
    console.log('✅ Created new text index');

    console.log('🔍 New indexes:');
    const newIndexes = await coursesCollection.indexes();
    console.log(newIndexes);

    console.log('✅ All done! You can now restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();
