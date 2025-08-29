import mongoose, { Document } from 'mongoose';
export interface IEmployee extends Document {
    employeeId?: string;
    phone: string;
    name: string;
    department: string;
    licensePlate: string;
    position?: string;
    email?: string;
    status: 'active' | 'inactive';
    joinDate?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IEmployee, {}, {}, {}, mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Employee.d.ts.map