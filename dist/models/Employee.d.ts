import mongoose, { Document } from 'mongoose';
export interface IEmployee extends Document {
    phone: string;
    name: string;
    department: string;
    licensePlate: string;
    status: 'active' | 'inactive';
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