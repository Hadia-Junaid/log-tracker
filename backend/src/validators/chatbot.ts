import Joi from 'joi';

export const chatbotMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  context: Joi.object({
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional().allow(''),
    timestamp: Joi.date().optional()
  }).optional(),
  model: Joi.string().optional().valid(
    'openai-gpt-4o-mini',
    'openai-gpt-4o',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro'
  )
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