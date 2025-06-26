import Joi from 'joi';
import mongoose from 'mongoose';

export const createUserGroupSchema = Joi.object({
  name: Joi.string().required(),
  is_admin: Joi.boolean(),
  assigned_applications: Joi.array().items(Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
    return value;
  })),
  members: Joi.array().items(Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
    return value;
  }))
});

export const updateUserGroupSchema = Joi.object({
  assigned_applications: Joi.array().items(Joi.string()),
  members: Joi.array().items(Joi.string())
});
