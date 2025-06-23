import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILog extends Document {
  application_id: Types.ObjectId;
  timestamp: Date;
  log_level: string;
  message: string;
}

const LogSchema: Schema = new Schema({
  application_id: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  timestamp: { type: Date, required: true },
  log_level: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ILog>('Log', LogSchema);
