import Joi from 'joi';

export const searchUsersSchema = Joi.object({
  searchString: Joi.string().required().min(1).max(100)
});

export const patchUserAndGroupSchema = Joi.object({
  userEmail: Joi.string().email().required(),
  groupId: Joi.string().required().min(1),
  userName: Joi.string().optional().max(255)
}); 