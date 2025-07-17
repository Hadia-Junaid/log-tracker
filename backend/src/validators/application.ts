import Joi from "joi";

export const applicationSchema = Joi.object({
  name: Joi.string()
    .min(5)
    .max(20)
    .pattern(/^[a-zA-Z0-9 _-]+$/)
    .required(),

  hostname: Joi.string().max(255).required(),

  environment: Joi.string()
    .valid("Development", "Testing", "Staging", "Production")
    .required(),

  isActive: Joi.boolean().required(),

  description: Joi.string()
    .min(10)
    .max(100)
    .pattern(/^[a-zA-Z0-9 _\-\.,:;()[\]'""]*$/)
    .required(), 

  userGroups: Joi.array().items(Joi.string()).optional(),
});


export const getApplicationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).default(8),
  search: Joi.string().allow('').trim().default(''),
  status: Joi.string().valid('active', 'inactive', 'all').optional(),
  environment: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).default([]),
  sort: Joi.string()
    .valid('name', 'nameDesc', 'createdAt', 'createdAtDesc')
    .optional(),
  allPages: Joi.boolean().truthy('true').falsy('false').default(false).optional(),
});
