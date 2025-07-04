import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
  autoRefresh: Joi.boolean().required(),
  logsPerPage: Joi.number().required(),
  autoRefreshTime: Joi.number().required() 
});
