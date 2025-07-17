import Joi from 'joi';

export const pinnedAppsSchema = Joi.object({
  appIds: Joi.array().items(Joi.string()).required(),
});

