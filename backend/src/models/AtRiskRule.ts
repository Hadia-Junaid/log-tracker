import mongoose, { Schema, Document } from 'mongoose';

export interface IAtRiskRule extends Document {
  type_of_logs: string;
  operator: string;
  unit: string;
  time: number;
  number_of_logs: number;
}

const AtRiskRuleSchema: Schema = new Schema({
  type_of_logs: { type: String, required: true },
  operator: { type: String, required: true },
  unit: { type: String, required: true },
  time: { type: Number, required: true },
  number_of_logs: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<IAtRiskRule>('AtRiskRule', AtRiskRuleSchema);
