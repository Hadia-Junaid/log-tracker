import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserGroup extends Document {
  name: string;
  is_admin: boolean;
  assigned_applications: Types.ObjectId[];
  members: Types.ObjectId[];
  is_active: boolean;
}

const UserGroupSchema: Schema = new Schema({
  name: { type: String, required: true,  minlength: 5, maxlength: 20 },
  is_admin: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true},
  assigned_applications: [{
        type: Schema.Types.ObjectId,
        ref: 'Application',
        required: true
      }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }], //not required
}, { timestamps: true });

//Indexes for efficient querying
UserGroupSchema.index({ members: 1 });
UserGroupSchema.index({ assigned_applications: 1 });
UserGroupSchema.index({is_active:1});

export default mongoose.model<IUserGroup>('UserGroup', UserGroupSchema);
