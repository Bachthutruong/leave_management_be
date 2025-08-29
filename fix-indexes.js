const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leave_management';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    const collection = db.collection('employees');
    
    // Xóa tất cả index cũ
    console.log('Dropping all indexes...');
    await collection.dropIndexes();
    console.log('✅ All indexes dropped');
    
    // Tạo lại index mới
    console.log('Creating new indexes...');
    await collection.createIndex({ phone: 1 }, { unique: true });
    await collection.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('✅ New indexes created');
    
    // Hiển thị index hiện tại
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error fixing indexes:', error.message);
  }
}

fixIndexes();
