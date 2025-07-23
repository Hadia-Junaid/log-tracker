import Joi from 'joi';
import mongoose from 'mongoose';


export const createUserGroupSchema = Joi.object({
  name: Joi.string()
    .min(5)
    .max(20)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      'string.empty': 'Group name is required.',
      'string.min': 'Group name must be between 5 and 20 characters.',
      'string.max': 'Group name must be between 5 and 20 characters.',
      'string.pattern.base': 'Group name can only contain letters, numbers, spaces, hyphens (-), and underscores (_).',
      'any.required': 'Group name is required.'
    }),
  is_admin: Joi.boolean(),
  is_active: Joi.boolean().default(true).messages({
    'boolean.base': 'Active status must be a boolean value.'
  }),
  assigned_applications: Joi.array()
    .items(Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
      return value;
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'Please select at least one accessible application.',
      'any.required': 'Please select at least one accessible application.'
    }),
  members: Joi.array().items(Joi.object({
        name: Joi.string().min(2).max(100).required()
,
    email: Joi.string().email().required(),
  })).required()
});

export const updateUserGroupSchema = Joi.object({
  name: Joi.string(),
  is_admin: Joi.boolean(),
  is_active: Joi.boolean(),
  assigned_applications: Joi.array()
    .items(Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
      return value;
    }))
    .min(1)
    .messages({
      'array.min': 'Please select at least one accessible application.'
    }),
  members: Joi.array().items(Joi.object({
        name: Joi.string().min(2).max(100).required()
,
    email: Joi.string().email().required(),
  })).required()
});


export const getUserGroupsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).default(8),
  search: Joi.string().allow('').trim().default(''),
  is_admin: Joi.boolean().truthy('true').falsy('false').optional(),
  is_active: Joi.boolean().truthy('true').falsy('false').optional(),
  allPages: Joi.boolean().truthy('true').falsy('false').default(false),
});
