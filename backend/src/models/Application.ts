import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  name: string;
  hostname: string;
  environment: string;
  isActive: boolean;
  description: string;
}

const ApplicationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  hostname: { type: String, required: true },
  environment: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
