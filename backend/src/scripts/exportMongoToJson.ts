import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../db/init-db';
import { User } from '../models/User';
import { Student } from '../models/Student';
import Course from '../models/Course';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { Achievement } from '../models/Achievement';

async function exportCollection(name: string, docs: any[]) {
  const exportDir = path.join(__dirname, '../../export');

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filePath = path.join(exportDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
  console.log(`✅ Exported ${docs.length} documents from ${name} to ${filePath}`);
}

async function run() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB');
      process.exit(1);
    }

    console.log('📦 Fetching data from Mongo collections...');

    const [users, students, courses, enrollmentRequests, achievements] = await Promise.all([
      User.find().lean(),
      Student.find().lean(),
      Course.find().lean(),
      EnrollmentRequest.find().lean(),
      Achievement.find().lean()
    ]);

    await exportCollection('users', users);
    await exportCollection('students', students);
    await exportCollection('courses', courses);
    await exportCollection('enrollment_requests', enrollmentRequests);
    await exportCollection('achievements', achievements);

    console.log('✅ All collections exported successfully.');
  } catch (error) {
    console.error('❌ Error while exporting Mongo data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔚 MongoDB connection closed');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('❌ Unhandled error in export script:', err);
  process.exit(1);
});
