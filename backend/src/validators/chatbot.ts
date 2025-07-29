import Joi from 'joi';

export const chatbotMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  context: Joi.object({
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional().allow(''),
    timestamp: Joi.date().optional()
  }).optional(),
  useMCP: Joi.boolean().optional().default(true),
  mcpServerPath: Joi.string().optional().when('useMCP', {
    is: true,
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  })
});

export const mcpConnectSchema = Joi.object({
  serverPath: Joi.string().required()
});

export const chatHistoryQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
}); 