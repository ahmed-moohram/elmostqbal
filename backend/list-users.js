const mongoose = require('mongoose');

async function listUsers() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const users = await User.find({}).select('name studentPhone email role').limit(10);
    
    console.log('👥 Users in database:');
    console.log('=====================\n');
    
    users.forEach(user => {
      console.log(`📱 Phone: ${user.studentPhone}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`📧 Email: ${user.email || 'N/A'}`);
      console.log(`🎭 Role: ${user.role}`);
      console.log('---\n');
    });
    
    console.log(`Total: ${users.length} users`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listUsers();
