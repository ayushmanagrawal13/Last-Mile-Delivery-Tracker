import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticate, authorize, AuthRequest } from '../../../middleware/auth';
import { isMockMode, getMockStore, getPrisma } from '../../../config/prisma';
const router=Router();
const createSchema=z.object({ name:z.string().min(2), email:z.string().email(), password:z.string().min(6), currentZoneId:z.string().optional(), status:z.enum(['AVAILABLE','UNAVAILABLE','ON_DELIVERY']).optional() });

router.get('/', authenticate, authorize('ADMIN'), async(req,res,next)=>{
  try{
    let list:any[]=[];
    if(isMockMode()){
      const s=getMockStore() as any;
      list=s.agents.map((a:any)=>{
        const u=s.users.find((u:any)=>u.id===a.userId);
        const zone=s.zones.find((z:any)=>z.id===a.currentZoneId);
        return { ...a, user:u, currentZone:zone };
      });
    } else {
      list=await (getPrisma() as any).agent.findMany({ include:{ user:true, currentZone:true } });
    }
    res.json({ success:true, data:list });
  }catch(e){next(e)}
});
router.post('/', authenticate, authorize('ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const { name,email,password,currentZoneId,status }=createSchema.parse(req.body);
    const hashed=await bcrypt.hash(password,10);
    let agent:any; let user:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      if(s.users.find((u:any)=>u.email===email)) return res.status(409).json({ success:false, error:'Email exists' });
      user={ id:'u_'+Date.now(), email, password:hashed, name, role:'DELIVERY_AGENT', createdAt:new Date() };
      s.users.push(user);
      agent={ id:'ag_'+Date.now(), userId:user.id, status: status||'AVAILABLE', currentZoneId: currentZoneId||null, activeOrderCount:0, createdAt:new Date() };
      s.agents.push(agent);
    } else {
      const prisma=getPrisma() as any;
      user=await prisma.user.create({ data:{ email, password:hashed, name, role:'DELIVERY_AGENT' } });
      agent=await prisma.agent.create({ data:{ userId:user.id, status: status||'AVAILABLE', currentZoneId: currentZoneId||null } });
    }
    res.status(201).json({ success:true, data:{ ...agent, user } });
  }catch(e){next(e)}
});
router.put('/:id', authenticate, authorize('ADMIN','DELIVERY_AGENT'), async(req:AuthRequest,res,next)=>{
  try{
    const { id }=req.params; const { status, currentZoneId }=req.body;
    let agent:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      const idx=s.agents.findIndex((a:any)=>a.id===id);
      if(idx<0) return res.status(404).json({ success:false, error:'Not found' });
      // agent can only update self
      if(req.user!.role==='DELIVERY_AGENT'){
        const own=s.agents.find((a:any)=>a.userId===req.user!.id);
        if(!own || own.id!==id) return res.status(403).json({ success:false, error:'Can only update own availability' });
      }
      if(status) s.agents[idx].status=status;
      if(currentZoneId!==undefined) s.agents[idx].currentZoneId=currentZoneId;
      agent=s.agents[idx];
    } else {
      // similar check
      agent=await (getPrisma() as any).agent.update({ where:{ id }, data:{ status, currentZoneId } });
    }
    res.json({ success:true, data:agent });
  }catch(e){next(e)}
});
router.get('/me', authenticate, authorize('DELIVERY_AGENT'), async(req:AuthRequest,res,next)=>{
  try{
    let agent:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      agent=s.agents.find((a:any)=>a.userId===req.user!.id);
      if(agent){
        agent.user=s.users.find((u:any)=>u.id===agent.userId);
        agent.currentZone=s.zones.find((z:any)=>z.id===agent.currentZoneId);
      }
    } else {
      agent=await (getPrisma() as any).agent.findUnique({ where:{ userId:req.user!.id }, include:{ user:true, currentZone:true } });
    }
    res.json({ success:true, data:agent });
  }catch(e){next(e)}
});
export default router;
