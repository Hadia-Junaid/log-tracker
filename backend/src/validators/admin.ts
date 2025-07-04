import Joi from 'joi';

export const searchUsersSchema = Joi.object({
  searchString: Joi.string().required().min(1).max(100)
});
