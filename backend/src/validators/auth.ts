import Joi from 'joi';

export const exchangeAuthCodeSchema = Joi.object({
  auth_code: Joi.string().required().min(1).max(255)
});
