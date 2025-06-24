import Joi from 'joi';

export const addAtRiskRuleSchema = Joi.object({
  type_of_logs: Joi.string().required(),
  operator: Joi.string().required(),
  unit: Joi.string().required(),
  time: Joi.number().required(),
  number_of_logs: Joi.number().required()
});
