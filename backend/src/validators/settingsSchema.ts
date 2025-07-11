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
