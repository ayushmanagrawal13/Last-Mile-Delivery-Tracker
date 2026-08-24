import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../../middleware/auth';
import { isMockMode, getMockStore, getPrisma } from '../../../config/prisma';
const router=Router();
const schema=z.object({ orderType: z.enum(['B2B','B2C']), zoneRel: z.enum(['INTRA','INTER']), rate: z.number().positive() });
const codSchema=z.object({ orderType: z.enum(['B2B','B2C']), surchargeType: z.enum(['FLAT','PERCENT']), value: z.number().min(0) });

router.get('/rate-cards', authenticate, async(req,res,next)=>{
  try{
    let list:any[]=[];
    if(isMockMode()) list=(getMockStore() as any).rateCards;
    else list=await (getPrisma() as any).rateCard.findMany();
    res.json({ success:true, data:list });
  }catch(e){next(e)}
});
router.post('/rate-cards', authenticate, authorize('ADMIN'), async(req,res,next)=>{
  try{
    const { orderType, zoneRel, rate }=schema.parse(req.body);
    let rec:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      const exists=s.rateCards.find((r:any)=>r.orderType===orderType && r.zoneRel===zoneRel);
      if(exists) return res.status(409).json({ success:false, error:'Rate card exists for this combo, use PUT' });
      rec={ id:'rc_'+Date.now(), orderType, zoneRel, rate, unit:'per_kg', createdAt:new Date() };
      s.rateCards.push(rec);
    } else {
      rec=await (getPrisma() as any).rateCard.create({ data:{ orderType, zoneRel, rate } });
    }
    res.status(201).json({ success:true, data:rec });
  }catch(e){next(e)}
});
router.put('/rate-cards/:id', authenticate, authorize('ADMIN'), async(req,res,next)=>{
  try{
    const { id }=req.params; const { rate }=z.object({ rate:z.number().positive() }).parse(req.body);
    let rec:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      const idx=s.rateCards.findIndex((r:any)=>r.id===id);
      if(idx<0) return res.status(404).json({ success:false, error:'Not found' });
      s.rateCards[idx].rate=rate; rec=s.rateCards[idx];
    } else {
      rec=await (getPrisma() as any).rateCard.update({ where:{ id }, data:{ rate } });
    }
    res.json({ success:true, data:rec });
  }catch(e){next(e)}
});
router.get('/cod-config', authenticate, async(req,res,next)=>{
  try{
    let list:any[]=[];
    if(isMockMode()) list=(getMockStore() as any).codConfigs;
    else list=await (getPrisma() as any).codConfig.findMany();
    res.json({ success:true, data:list });
  }catch(e){next(e)}
});
router.post('/cod-config', authenticate, authorize('ADMIN'), async(req,res,next)=>{
  try{
    const { orderType, surchargeType, value }=codSchema.parse(req.body);
    let rec:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      let exists=s.codConfigs.find((c:any)=>c.orderType===orderType);
      if(exists){ exists.surchargeType=surchargeType; exists.value=value; rec=exists; } else {
        rec={ id:'cod_'+Date.now(), orderType, surchargeType, value, createdAt:new Date() };
        s.codConfigs.push(rec);
      }
    } else {
      rec=await (getPrisma() as any).codConfig.upsert({ where:{ orderType }, create:{ orderType, surchargeType, value }, update:{ surchargeType, value } });
    }
    res.status(201).json({ success:true, data:rec });
  }catch(e){next(e)}
});
export default router;
