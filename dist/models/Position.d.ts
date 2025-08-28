import mongoose, { Document } from 'mongoose';
export interface IPosition extends Document {
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPosition, {}, {}, {}, mongoose.Document<unknown, {}, IPosition, {}, {}> & IPosition & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Position.d.ts.map