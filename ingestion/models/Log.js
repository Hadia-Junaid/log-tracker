import mongoose, { Schema } from 'mongoose';


const LogSchema = new Schema({
  application_id: { type: String, required: true },
  timestamp: { type: Date, required: true },
  log_level: { type: String, required: true },
  trace_id: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Log', LogSchema);
