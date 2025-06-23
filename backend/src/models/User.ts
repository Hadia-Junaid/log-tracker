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
    autoRefresh: Boolean,
    autoRefreshTime: Number,
    logsPerPage: Number,
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
