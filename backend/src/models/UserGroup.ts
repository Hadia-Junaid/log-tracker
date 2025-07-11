import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserGroup extends Document {
  name: string;
  is_admin: boolean;
  assigned_applications: Types.ObjectId[];
  members: Types.ObjectId[];
  is_active: boolean;
}

const UserGroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
  assigned_applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

//Indexes for efficient querying
UserGroupSchema.index({ members: 1 });
UserGroupSchema.index({ assigned_applications: 1 });
UserGroupSchema.index({is_active:1});

export default mongoose.model<IUserGroup>('UserGroup', UserGroupSchema);
