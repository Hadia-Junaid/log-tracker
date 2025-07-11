import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
  autoRefresh: Joi.boolean().required(),
  logsPerPage: Joi.number().required(),
  autoRefreshTime: Joi.number().required() 
});

export const atRiskRuleSchema = Joi.object({
  type_of_logs: Joi.string().required(),
  operator: Joi.string().valid('more', 'less').required(),
  unit: Joi.string().valid('Minutes', 'Hours', 'Days').required(),
  time: Joi.number().required().positive(),
  number_of_logs: Joi.number().required().positive()
});

export const updateRetentionSchema = Joi.object({
  retentionDays: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .required()
    .messages({
      'number.base': '"retentionDays" must be a number',
      'number.min': '"retentionDays" must be at least {#limit} day',
      'number.max': '"retentionDays" must not exceed {#limit} days',
      'any.required': '"retentionDays" is required'
    }),
  updatedBy: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': '"updatedBy" must be a string',
      'string.email': '"updatedBy" must be a valid email',
      'any.required': '"updatedBy" is required'
    })
})