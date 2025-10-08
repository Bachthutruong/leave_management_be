const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leave_management';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Admin Schema
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Admin = mongoose.model('Admin', AdminSchema);

// Employee Schema
const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joinDate: {
    type: String
  }
}, {
  timestamps: true
});

const Employee = mongoose.model('Employee', EmployeeSchema);

// Half Day Option Schema
const HalfDayOptionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const HalfDayOption = mongoose.model('HalfDayOption', HalfDayOptionSchema);

async function seedData() {
  try {
    await connectDB();

    // Clear existing data
    await Admin.deleteMany({});
    await Employee.deleteMany({});
    await HalfDayOption.deleteMany({});
    console.log('Cleared existing data');

    // Create default admin
    const admin = new Admin({
      username: 'admin',
      password: 'admin123', // Will be hashed by pre-save hook
      name: 'Administrator',
      email: 'admin@company.com',
      role: 'admin',
      isActive: true,
    });
    await admin.save();
    console.log('Created default admin user');

    // Create half-day options
    const halfDayOptions = [
      { code: 'morning', label: 'Sáng (8:00 - 12:00)' },
      { code: 'afternoon', label: 'Chiều (13:00 - 17:00)' },
      { code: 'evening', label: 'Tối (18:00 - 22:00)' },
    ];

    for (const option of halfDayOptions) {
      const halfDayOption = new HalfDayOption(option);
      await halfDayOption.save();
    }
    console.log('Created half-day options');

    // Create sample employees
    const employees = [
      {
        employeeId: 'EMP001',
        phone: '0901234567',
        name: 'Nguyễn Văn An',
        department: 'IT',
        position: 'Software Developer',
        email: 'an.nguyen@company.com',
        licensePlate: '30A12345',
        status: 'active',
        joinDate: '2023-01-15',
      },
      {
        employeeId: 'EMP002',
        phone: '0901234568',
        name: 'Trần Thị Bình',
        department: 'HR',
        position: 'HR Manager',
        email: 'binh.tran@company.com',
        licensePlate: '30A12346',
        status: 'active',
        joinDate: '2023-02-20',
      },
      {
        employeeId: 'EMP003',
        phone: '0901234569',
        name: 'Lê Văn Cường',
        department: 'Sales',
        position: 'Sales Representative',
        email: 'cuong.le@company.com',
        licensePlate: '30A12347',
        status: 'active',
        joinDate: '2023-03-10',
      },
    ];

    for (const employeeData of employees) {
      const employee = new Employee(employeeData);
      await employee.save();
    }
    console.log('Created sample employees');

    console.log('Seed data completed successfully!');
    console.log('\nDefault accounts:');
    console.log('Admin - Username: admin, Password: admin123');
    console.log('Employee IDs: EMP001, EMP002, EMP003');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData();



