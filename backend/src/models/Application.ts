import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  name: string;
  hostname: string;
  environment: string;
  description: string;
}

const ApplicationSchema: Schema = new Schema({
  name: { type: String, required: true },
  hostname: { type: String, required: true },
  environment: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
