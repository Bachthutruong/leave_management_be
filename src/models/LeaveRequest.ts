import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveRequest extends Document {
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'full_day' | 'half_day' | 'hourly';
  halfDayType?: 'morning' | 'afternoon' | 'evening';
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  reason?: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['full_day', 'half_day', 'hourly'],
    required: true
  },
  halfDayType: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: function() {
      return this.leaveType === 'half_day';
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: function() {
      return this.leaveType === 'hourly';
    }
  },
  endTime: {
    type: String,
    required: function() {
      return this.leaveType === 'hourly';
    }
  },
  reason: {
    type: String,
    trim: true
  },
  attachments: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
