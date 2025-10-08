import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId?: string;
  phone: string;
  name: string;
  department: string;
  licensePlate: string;
  position?: string;
  email?: string;
  role?: 'employee' | 'department_head';
  status: 'active' | 'inactive';
  joinDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: {
    type: String,
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
    lowercase: true,
    required: false
  },
  role: {
    type: String,
    enum: ['employee', 'department_head'],
    default: 'employee'
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

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
