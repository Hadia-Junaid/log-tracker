// src/models/dataRetention.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface IDataRetention extends Document {
  type: 'logSettings'
  retentionDays: number
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

const DataRetentionSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['logSettings'],
      default: 'logSettings'
    },
    retentionDays: {
      type: Number,
      required: true
    },
    updatedBy: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

export default mongoose.model<IDataRetention>('DataRetention', DataRetentionSchema)
