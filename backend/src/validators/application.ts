import Joi from 'joi';

export const addApplicationSchema = Joi.object({
  name: Joi.string().required(),
  hostname: Joi.string().required(),
  environment: Joi.string().required(),
  description: Joi.string().optional()
});

export const updateApplicationSchema = Joi.object({
  name: Joi.string().required(),
  hostname: Joi.string().required(),
  environment: Joi.string().required(),
  description: Joi.string().optional()
});
  