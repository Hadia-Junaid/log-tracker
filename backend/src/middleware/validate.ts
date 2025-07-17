import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

// For validating request bodies
export function validateBody(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        if (error) {
            logger.warn(`Validation error: ${error.details[0].message}`);
            res.status(400).send({ error: error.details[0].message });
            return;
        }
        next();
    };
}

// For validating URL parameters
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    if (error) {
      logger.warn(`Params validation error: ${error.details[0].message}`);
      res.status(400).send({ error: error.details[0].message });
      return;
    }
    next();
  };
}

// For validating query strings
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    if (error) {
      logger.warn(`Query validation error: ${error.details[0].message}`);
      res.status(400).send({ error: error.details[0].message });
      return;
    }
    next();
  };
}
