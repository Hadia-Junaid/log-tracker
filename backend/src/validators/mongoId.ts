import Joi from 'joi';

export const mongoDbIdSchema = Joi.object({
  id: Joi.string().length(24).hex().required().label('MongoDB ID'),
});