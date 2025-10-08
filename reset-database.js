const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leave_management';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // Xóa toàn bộ collection employees
    console.log('Dropping employees collection...');
    try {
      await db.collection('employees').drop();
      console.log('✅ Employees collection dropped');
    } catch (error) {
      console.log('Employees collection not found or already dropped');
    }
    
    // Xóa toàn bộ collection admins
    console.log('Dropping admins collection...');
    try {
      await db.collection('admins').drop();
      console.log('✅ Admins collection dropped');
    } catch (error) {
      console.log('Admins collection not found or already dropped');
    }
    
    // Xóa toàn bộ collection halfdayoptions
    console.log('Dropping halfdayoptions collection...');
    try {
      await db.collection('halfdayoptions').drop();
      console.log('✅ HalfDayOptions collection dropped');
    } catch (error) {
      console.log('HalfDayOptions collection not found or already dropped');
    }
    
    console.log('✅ Database reset completed!');
    console.log('Now restart your server to recreate collections with new schemas.');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
  }
}

resetDatabase();



