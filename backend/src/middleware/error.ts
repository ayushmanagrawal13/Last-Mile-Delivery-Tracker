import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
export function errorHandler(err:any, _req:Request, res:Response, _next:NextFunction){
  if(err instanceof ZodError) return res.status(400).json({ success:false, error:'Validation failed', details: err.errors });
  logger.error({ err }, 'Unhandled');
  res.status(err.status||500).json({ success:false, error: err.message || 'Internal error' });
}
