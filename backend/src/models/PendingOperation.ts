import mongoose, { Schema, Document, Types, Model } from "mongoose";

export interface IPendingOperation extends Document {
  toolName: string;
  toolArgs: Record<string, any>;
  _id: Types.ObjectId; // ✅ Explicitly declare _id type
}

const PendingOperationSchema: Schema<IPendingOperation> = new Schema(
  {
    toolName: { type: String, required: true },
    toolArgs: { type: Schema.Types.Mixed, required: true }, // ✅ use Schema.Types.Mixed for flexibility
  },
  { timestamps: true }
);

const PendingOperation: Model<IPendingOperation> =
  mongoose.model<IPendingOperation>("PendingOperation", PendingOperationSchema);

export default PendingOperation;
