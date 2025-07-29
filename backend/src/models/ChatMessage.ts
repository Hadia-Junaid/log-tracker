import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  sessionId: string;
  message: string;
  response: string;
  functionCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
  }>;
  timestamp: Date;
  tokensUsed?: number;
  modelUsed?: string;
}

const chatMessageSchema = new Schema<IChatMessage>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  functionCalls: [{
    name: {
      type: String,
      required: true
    },
    arguments: {
      type: Schema.Types.Mixed,
      required: true
    },
    result: {
      type: Schema.Types.Mixed
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  tokensUsed: {
    type: Number
  },
  modelUsed: {
    type: String,
    default: 'gpt-4o-mini'
  }
});

// Create indexes for better query performance
chatMessageSchema.index({ userId: 1, timestamp: -1 });
chatMessageSchema.index({ sessionId: 1, timestamp: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema); 