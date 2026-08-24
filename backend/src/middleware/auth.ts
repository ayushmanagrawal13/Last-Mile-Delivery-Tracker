import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
export interface AuthRequest extends Request { user?: { id:string; email:string; role:string; name:string } }
export function authenticate(req: AuthRequest, res: Response, next: NextFunction){
  const h=req.headers.authorization;
  if(!h?.startsWith('Bearer ')) return res.status(401).json({ success:false, error:'Missing token' });
  const token=h.split(' ')[1];
  try{ req.user=jwt.verify(token, env.JWT_SECRET) as any; next(); } catch{ return res.status(401).json({ success:false, error:'Invalid token' }); }
}
export function authorize(...roles:string[]){
  return (req: AuthRequest, res: Response, next: NextFunction)=>{
    if(!req.user) return res.status(401).json({ success:false, error:'Unauthorized' });
    if(!roles.includes(req.user.role)) return res.status(403).json({ success:false, error:'Forbidden requires '+roles.join('/') });
    next();
  };
}
