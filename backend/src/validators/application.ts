import Joi from 'joi';

export const applicationSchema = Joi.object({
  name: Joi.string().max(100).required(),
  hostname: Joi.string().max(255).required(),
  environment: Joi.string().valid('Development', 'Testing', 'Staging', 'Production').required(),
  description: Joi.string().max(500).optional()
});
  