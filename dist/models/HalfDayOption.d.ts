import mongoose, { Document } from 'mongoose';
export interface IHalfDayOption extends Document {
    code: 'morning' | 'afternoon' | 'evening';
    label: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IHalfDayOption, {}, {}, {}, mongoose.Document<unknown, {}, IHalfDayOption, {}, {}> & IHalfDayOption & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=HalfDayOption.d.ts.map