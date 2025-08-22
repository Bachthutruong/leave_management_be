import mongoose, { Document, Schema } from 'mongoose';

export interface IHalfDayOption extends Document {
  code: 'morning' | 'afternoon' | 'evening';
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

const HalfDayOptionSchema = new Schema<IHalfDayOption>({
  code: { type: String, enum: ['morning', 'afternoon', 'evening'], required: true, unique: true },
  label: { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.model<IHalfDayOption>('HalfDayOption', HalfDayOptionSchema);
