import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../../../middleware/auth';
import { isMockMode, getMockStore, getPrisma } from '../../../config/prisma';
const router=Router();
const zoneSchema=z.object({ name:z.string().min(2) });
const areaSchema=z.object({ zoneId:z.string(), areas:z.array(z.string().min(1)).min(1) });

router.get('/', authenticate, async(req,res,next)=>{
  try{
    let zones:any[]=[];
    if(isMockMode()){
      const s=getMockStore() as any;
      zones=s.zones.map((z:any)=>({ ...z, areas: s.zoneAreas.filter((a:any)=>a.zoneId===z.id) }));
    } else {
      zones=await (getPrisma() as any).zone.findMany({ include:{ areas:true } });
    }
    res.json({ success:true, data:zones });
  }catch(e){next(e)}
});
router.post('/', authenticate, authorize('ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const { name }=zoneSchema.parse(req.body);
    let zone:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      if(s.zones.find((z:any)=>z.name===name)) return res.status(409).json({ success:false, error:'Zone exists' });
      zone={ id:'zone_'+Date.now(), name, createdAt:new Date() };
      s.zones.push(zone);
    } else {
      zone=await (getPrisma() as any).zone.create({ data:{ name } });
    }
    res.status(201).json({ success:true, data:zone });
  }catch(e){next(e)}
});
router.post('/areas', authenticate, authorize('ADMIN'), async(req,res,next)=>{
  try{
    const { zoneId, areas }=areaSchema.parse(req.body);
    let created:any[]=[];
    if(isMockMode()){
      const s=getMockStore() as any;
      const zone=s.zones.find((z:any)=>z.id===zoneId);
      if(!zone) return res.status(404).json({ success:false, error:'Zone not found' });
      for(const area of areas){
        if(s.zoneAreas.find((a:any)=>a.area.toLowerCase()===area.toLowerCase())) return res.status(409).json({ success:false, error:`Area already mapped: ${area}` });
        const rec={ id:'za_'+Date.now()+'_'+Math.random().toString(36).slice(2,5), zoneId, area, createdAt:new Date() };
        s.zoneAreas.push(rec); created.push(rec);
      }
    } else {
      const prisma=getPrisma() as any;
      for(const area of areas){
        const rec=await prisma.zoneArea.create({ data:{ zoneId, area } });
        created.push(rec);
      }
    }
    res.status(201).json({ success:true, data:created });
  }catch(e){next(e)}
});
router.get('/areas', authenticate, async(req,res,next)=>{
  try{
    let areas:any[]=[];
    if(isMockMode()) areas=(getMockStore() as any).zoneAreas;
    else areas=await (getPrisma() as any).zoneArea.findMany({ include:{ zone:true } });
    res.json({ success:true, data:areas });
  }catch(e){next(e)}
});
router.delete('/:id', authenticate, authorize('ADMIN'), async(req,res,next)=>{
  try{
    const { id }=req.params;
    if(isMockMode()){
      const s=getMockStore() as any;
      const idx=s.zones.findIndex((z:any)=>z.id===id);
      if(idx<0) return res.status(404).json({ success:false, error:'Not found' });
      s.zones.splice(idx,1);
      s.zoneAreas=s.zoneAreas.filter((a:any)=>a.zoneId!==id);
    } else {
      await (getPrisma() as any).zone.delete({ where:{ id } });
    }
    res.json({ success:true, data:{} });
  }catch(e){next(e)}
});
export default router;
