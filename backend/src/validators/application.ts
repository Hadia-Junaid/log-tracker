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
    .allow("")
    .optional()
    .min(10)
    .max(100)
    .pattern(/^[a-zA-Z0-9 _\-\.,:;()[\]\'""]*$/),

  userGroups: Joi.array().items(Joi.string()).optional(),
});
