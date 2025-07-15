import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  pinned_applications: Types.ObjectId[];
  settings: {
    autoRefresh: boolean;
    autoRefreshTime: number;
    logsPerPage: number;
  };
}
const UserSchema: Schema = new Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  pinned_applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  settings: {
    autoRefresh: { type: Boolean, default: false },
    autoRefreshTime: { type: Number, default: 30 },
    logsPerPage: { type: Number, default: 25 },
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
