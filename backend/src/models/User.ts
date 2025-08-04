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
  saved_messages: string[];
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    pinned_applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
    settings: {
      autoRefresh: { type: Boolean, default: false },
      autoRefreshTime: {
        type: Number,
        default: 30,
        min: [5, 'autoRefreshTime must be at least 5'],
        max: [120, 'autoRefreshTime cannot exceed 120'],
      },
      logsPerPage: {
        type: Number,
        default: 25,
        enum: {
          values: [25, 50, 100],
          message: 'logsPerPage must be 25, 50, or 100',
        },
      },
    },
    saved_messages: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
