import Joi from 'joi';

export const chatbotMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  context: Joi.object({
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional().allow(''),
    timestamp: Joi.date().optional()
  }).optional()
});

export const mcpConnectSchema = Joi.object({
  serverPath: Joi.string().required()
});

export const chatHistoryQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

export const savePromptSchema = Joi.object({
  prompt: Joi.string().required().min(1).max(1000)
});

export const deletePromptSchema = Joi.object({
  prompt: Joi.string().required().min(1).max(1000)
}); 