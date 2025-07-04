import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

export default function validate(schema: Joi.ObjectSchema) {
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

