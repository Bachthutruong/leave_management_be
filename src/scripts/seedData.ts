import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import Employee from '../models/Employee';
import HalfDayOption from '../models/HalfDayOption';
import Department from '../models/Department';
import Position from '../models/Position';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leave_management';

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Admin.deleteMany({});
    await Employee.deleteMany({});
    await HalfDayOption.deleteMany({});
    await Department.deleteMany({});
    await Position.deleteMany({});
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

    // Create default departments
    const departments = [
      { name: 'IT', code: 'IT', description: 'Information Technology Department' },
      { name: 'HR', code: 'HR', description: 'Human Resources Department' },
      { name: 'Sales', code: 'SALES', description: 'Sales Department' },
      { name: 'Marketing', code: 'MKT', description: 'Marketing Department' },
      { name: 'Finance', code: 'FIN', description: 'Finance Department' },
      { name: 'Operations', code: 'OPS', description: 'Operations Department' },
      { name: 'Customer Service', code: 'CS', description: 'Customer Service Department' },
    ];

    for (const deptData of departments) {
      const department = new Department(deptData);
      await department.save();
    }
    console.log('Created default departments');

    // Create default positions
    const positions = [
      { name: 'Employee', code: 'EMP', description: 'Regular Employee' },
      { name: 'Team Lead', code: 'TL', description: 'Team Leader' },
      { name: 'Manager', code: 'MGR', description: 'Department Manager' },
      { name: 'Director', code: 'DIR', description: 'Director' },
      { name: 'Intern', code: 'INT', description: 'Intern' },
    ];

    for (const posData of positions) {
      const position = new Position(posData);
      await position.save();
    }
    console.log('Created default positions');

    // Create sample employees
    const employees = [
      {
        employeeId: 'EMP001',
        name: 'Nguyễn Văn An',
        department: 'IT',
        position: 'Software Developer',
        email: 'an.nguyen@company.com',
        phone: '0901234567',
        status: 'active',
        joinDate: '2023-01-15',
      },
      {
        employeeId: 'EMP002',
        name: 'Trần Thị Bình',
        department: 'HR',
        position: 'HR Manager',
        email: 'binh.tran@company.com',
        phone: '0901234568',
        status: 'active',
        joinDate: '2023-02-20',
      },
      {
        employeeId: 'EMP003',
        name: 'Lê Văn Cường',
        department: 'Sales',
        position: 'Sales Representative',
        email: 'cuong.le@company.com',
        phone: '0901234569',
        status: 'active',
        joinDate: '2023-03-10',
      },
      {
        employeeId: 'EMP004',
        name: 'Phạm Thị Dung',
        department: 'Marketing',
        position: 'Marketing Specialist',
        email: 'dung.pham@company.com',
        phone: '0901234570',
        status: 'active',
        joinDate: '2023-04-05',
      },
      {
        employeeId: 'EMP005',
        name: 'Hoàng Văn Em',
        department: 'Finance',
        position: 'Accountant',
        email: 'em.hoang@company.com',
        phone: '0901234571',
        status: 'active',
        joinDate: '2023-05-12',
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
    console.log('Employee IDs: EMP001, EMP002, EMP003, EMP004, EMP005');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData();
