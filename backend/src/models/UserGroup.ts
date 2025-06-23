import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserGroup extends Document {
  name: string;
  is_admin: boolean;
  assigned_applications: Types.ObjectId[];
  members: Types.ObjectId[];
}

const UserGroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
  assigned_applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });


export default mongoose.model<IUserGroup>('UserGroup', UserGroupSchema);
