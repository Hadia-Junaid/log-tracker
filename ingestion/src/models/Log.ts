import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILog extends Document {
  application_id: Types.ObjectId | string;
  timestamp: Date;
  log_level: string;
  message: string;
  trace_id: string;
}

const LogSchema: Schema = new Schema({
  application_id: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  timestamp: { type: Date, required: true },
  log_level: { type: String, required: true },
  trace_id: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

// Index for efficient querying
LogSchema.index({ application_id: 1, timestamp: -1 });

// TTL Index for automatic deletion after 30 days
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.model<ILog>('Log', LogSchema);
