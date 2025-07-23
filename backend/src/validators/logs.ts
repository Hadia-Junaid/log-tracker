import Joi from 'joi';

export const getLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  app_ids: Joi.string().allow('').default(''), // comma-separated IDs
  log_levels: Joi.string().allow('').default(''), // comma-separated levels
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  search: Joi.string().allow('').trim().default(''),
});

export const exportLogsQuerySchema = Joi.object({
  app_ids: Joi.string().allow('').default(''),
  log_levels: Joi.string().allow('').default(''),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  search: Joi.string().allow('').trim().default(''),
  is_csv: Joi.boolean().truthy('true').falsy('false').default(false),
});

export const getLogActivityQuerySchema = Joi.object({
  app_ids: Joi.string().allow('').default(''),
  log_levels: Joi.string().allow('').default(''),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  group_by: Joi.string().valid('hour', 'day', 'week', 'month').default('hour').optional(),
});

