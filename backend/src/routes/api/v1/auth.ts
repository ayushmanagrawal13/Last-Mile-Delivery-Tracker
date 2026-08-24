import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { isMockMode, getMockStore, getPrisma } from '../../../config/prisma';
import { authenticate, AuthRequest } from '../../../middleware/auth';
import { logger } from '../../../config/logger';
const router=Router();
const regSchema=z.object({ email:z.string().email(), password:z.string().min(6), name:z.string().min(2), role:z.enum(['CUSTOMER','DELIVERY_AGENT']).optional() });
const loginSchema=z.object({ email:z.string().email(), password:z.string() });
router.post('/register', async(req,res,next)=>{
  try{
    const { email,password,name,role}=regSchema.parse(req.body);
    const r=(role as string)||'CUSTOMER';
    const hashed=await bcrypt.hash(password,10);
    let user:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      if(s.users.find((u:any)=>u.email===email)) return res.status(409).json({ success:false, error:'Email exists' });
      user={ id:'u_'+Date.now()+'_'+Math.random().toString(36).slice(2,5), email, password:hashed, name, role:r, createdAt:new Date() };
      s.users.push(user);
      if(r==='DELIVERY_AGENT'){
        // agent must be created via admin, but allow self for test
        s.agents.push({ id:'ag_'+Date.now(), userId:user.id, status:'AVAILABLE', currentZoneId:null, activeOrderCount:0, createdAt:new Date() });
      }
    } else {
      const prisma=getPrisma() as any;
      if(await prisma.user.findUnique({ where:{ email } })) return res.status(409).json({ success:false, error:'Email exists' });
      user=await prisma.user.create({ data:{ email, password:hashed, name, role:r as any } });
      if(r==='DELIVERY_AGENT') await prisma.agent.create({ data:{ userId:user.id, status:'AVAILABLE' } });
    }
    const token=jwt.sign({ id:user.id, email:user.email, role:user.role, name:user.name }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any);
    logger.info({ email }, 'Registered');
    res.status(201).json({ success:true, data:{ user:{ id:user.id, email:user.email, name:user.name, role:user.role }, token } });
  }catch(e){next(e)}
});
router.post('/login', async(req,res,next)=>{
  try{
    const { email,password }=loginSchema.parse(req.body);
    let user:any;
    if(isMockMode()) user=(getMockStore() as any).users.find((u:any)=>u.email===email);
    else user=await (getPrisma() as any).user.findUnique({ where:{ email } });
    if(!user) return res.status(401).json({ success:false, error:'Invalid credentials' });
    const ok=await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ success:false, error:'Invalid credentials' });
    const token=jwt.sign({ id:user.id, email:user.email, role:user.role, name:user.name }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any);
    res.json({ success:true, data:{ user:{ id:user.id, email:user.email, name:user.name, role:user.role }, token } });
  }catch(e){next(e)}
});
router.get('/me', authenticate, async(req:AuthRequest,res)=>{ res.json({ success:true, data:{ user:req.user } }); });
export default router;
