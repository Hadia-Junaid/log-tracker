import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  name: string;
  hostname: string;
  environment: string;
  isActive: boolean;
  description: string;
}

const ApplicationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, minlength: 5, maxlength: 20 },
  hostname: { type: String, required: true },
  environment: { type: String, required: true ,  enum: ['Development', 'Testing', 'Staging', 'Production']},
  isActive: { type: Boolean, default: true , maxlength: 254},
  description: { type: String, required: true, minlength: 10, maxlength: 100}
}, { timestamps: true });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
