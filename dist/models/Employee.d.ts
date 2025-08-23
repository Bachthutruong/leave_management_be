import mongoose, { Document } from 'mongoose';
export interface IEmployee extends Document {
    employeeId: string;
    name: string;
    department: string;
    position: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive';
    joinDate: Date;
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