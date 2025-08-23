import mongoose, { Document } from 'mongoose';
interface IAttachment {
    url: string;
    publicId: string;
    originalName: string;
    size: number;
    mimetype: string;
}
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
    attachments: IAttachment[];
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ILeaveRequest, {}, {}, {}, mongoose.Document<unknown, {}, ILeaveRequest, {}, {}> & ILeaveRequest & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LeaveRequest.d.ts.map