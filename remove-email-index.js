const mongoose = require('mongoose');
require('dotenv').config();

async function removeEmailIndex() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leave_management';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    const collection = db.collection('employees');
    
    // Xóa index email
    console.log('Removing email index...');
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Email index removed');
    } catch (error) {
      console.log('Email index not found or already removed');
    }
    
    // Hiển thị index hiện tại
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error removing email index:', error.message);
  }
}

removeEmailIndex();
