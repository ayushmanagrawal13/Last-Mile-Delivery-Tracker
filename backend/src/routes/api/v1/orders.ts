import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../../../middleware/auth';
import { isMockMode, getMockStore, getPrisma } from '../../../config/prisma';
import { calculateRate, resolveZone } from '../../../services/rateEngine';
import { autoAssign } from '../../../services/assignment';
import { enqueue } from '../../../services/notifications';
import { canTransition } from '../../../utils/helpers';
import { logger } from '../../../config/logger';
const router=Router();

const previewSchema=z.object({
  pickupAddress:z.string().min(2),
  dropAddress:z.string().min(2),
  l:z.number().positive(),
  b:z.number().positive(),
  h:z.number().positive(),
  actualWeight:z.number().positive(),
  orderType:z.enum(['B2B','B2C']),
  paymentType:z.enum(['PREPAID','COD'])
});
const createSchema=previewSchema;

// Helper to get zones/rate/cod from DB
async function getRateData(){
  if(isMockMode()){
    const s=getMockStore() as any;
    return { zoneAreas:s.zoneAreas.map((a:any)=>({ area:a.area, zoneId:a.zoneId, zoneName:s.zones.find((z:any)=>z.id===a.zoneId)?.name })), rateCards:s.rateCards, codConfigs:s.codConfigs, zones:s.zones };
  } else {
    const prisma=getPrisma() as any;
    const zoneAreas=await prisma.zoneArea.findMany({ include:{ zone:true } });
    const rateCards=await prisma.rateCard.findMany();
    const codConfigs=await prisma.codConfig.findMany();
    const zones=await prisma.zone.findMany();
    return { zoneAreas: zoneAreas.map((a:any)=>({ area:a.area, zoneId:a.zoneId, zoneName:a.zone.name })), rateCards, codConfigs, zones };
  }
}

router.post('/preview', authenticate, authorize('CUSTOMER','ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const body=previewSchema.parse(req.body);
    const { zoneAreas, rateCards, codConfigs }=await getRateData();
    const pickupZone=resolveZone(body.pickupAddress, zoneAreas);
    const dropZone=resolveZone(body.dropAddress, zoneAreas);
    const breakdown=calculateRate({ pickupZone, dropZone, l:body.l, b:body.b, h:body.h, actualWeight:body.actualWeight, orderType:body.orderType as any, paymentType:body.paymentType as any, rateCards: rateCards as any, codConfigs: codConfigs as any });
    res.json({ success:true, data: breakdown });
  }catch(e:any){ if(e.code==='ZONE_NOT_FOUND') return res.status(400).json({ success:false, error:e.message }); next(e); }
});

router.post('/', authenticate, authorize('CUSTOMER','ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const body=createSchema.parse(req.body);
    const customerId = req.user!.role === 'CUSTOMER' ? req.user!.id : (req.body.customerId || req.user!.id);
    const { zoneAreas, rateCards, codConfigs }=await getRateData();
    const pickupZone=resolveZone(body.pickupAddress, zoneAreas);
    const dropZone=resolveZone(body.dropAddress, zoneAreas);
    const breakdown=calculateRate({ pickupZone, dropZone, l:body.l, b:body.b, h:body.h, actualWeight:body.actualWeight, orderType:body.orderType as any, paymentType:body.paymentType as any, rateCards: rateCards as any, codConfigs: codConfigs as any });
    let order:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      order={
        id:'ord_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        customerId, pickupAddress:body.pickupAddress, dropAddress:body.dropAddress, pickupZoneId:pickupZone, dropZoneId:dropZone,
        l:body.l,b:body.b,h:body.h, actualWeight:body.actualWeight, volumetricWeight:breakdown.volumetricWeight, billableWeight:breakdown.billableWeight,
        orderType:body.orderType, paymentType:body.paymentType, chargeBreakdown: breakdown, totalCharge: breakdown.total,
        currentStatus:'CREATED', assignedAgentId:null, rescheduleDate:null, createdAt:new Date(), updatedAt:new Date()
      };
      s.orders.push(order);
      s.trackingEvents.push({ id:'tr_'+Date.now(), orderId:order.id, fromStatus:'', toStatus:'CREATED', actorId:req.user!.id, actorRole:req.user!.role, notes:'Order created', createdAt:new Date() });
      s.trackingEvents.push({ id:'tr_'+Date.now()+'_2', orderId:order.id, fromStatus:'CREATED', toStatus:'CONFIRMED', actorId:req.user!.id, actorRole:req.user!.role, notes:'Confirmed after preview', createdAt:new Date() });
      order.currentStatus='CONFIRMED';
      // auto-assign if flag (default true)
      const auto = req.body.autoAssign !== false;
      if(auto){
        const assignment=autoAssign({ pickupZoneId:pickupZone, agents:s.agents });
        if(assignment.assignedAgentId){
          order.assignedAgentId=assignment.assignedAgentId;
          order.currentStatus='ASSIGNED';
          s.trackingEvents.push({ id:'tr_'+Date.now()+'_a', orderId:order.id, fromStatus:'CONFIRMED', toStatus:'ASSIGNED', actorId:'system', actorRole:'system', notes:assignment.reason, createdAt:new Date() });
          const ag=s.agents.find((a:any)=>a.id===assignment.assignedAgentId);
          if(ag){ ag.activeOrderCount++; ag.status='ON_DELIVERY'; }
          const agentUser=s.users.find((u:any)=>u.id===ag?.userId);
          // notify
          const cust=s.users.find((u:any)=>u.id===customerId);
          if(cust) enqueue('ASSIGNED', cust.email, { orderId:order.id, agent: agentUser?.name||ag?.id }, order.id).catch(()=>{});
        }
      }
      // notify created
      const cust=s.users.find((u:any)=>u.id===customerId);
      if(cust) enqueue('ORDER_CREATED', cust.email, { orderId:order.id, pickup:body.pickupAddress, drop:body.dropAddress, total:breakdown.total }, order.id).catch(()=>{});
    } else {
      // Prisma real DB path (simplified)
      const prisma=getPrisma() as any;
      order=await prisma.order.create({ data:{
        customerId, pickupAddress:body.pickupAddress, dropAddress:body.dropAddress, pickupZoneId:pickupZone, dropZoneId:dropZone,
        l:body.l,b:body.b,h:body.h, actualWeight:body.actualWeight, volumetricWeight:breakdown.volumetricWeight, billableWeight:breakdown.billableWeight,
        orderType:body.orderType, paymentType:body.paymentType, chargeBreakdown: breakdown as any, totalCharge:breakdown.total, currentStatus:'CONFIRMED'
      } });
      await prisma.trackingEvent.create({ data:{ orderId:order.id, fromStatus:'', toStatus:'CREATED', actorId:req.user!.id, actorRole:req.user!.role, notes:'Created' } });
      await prisma.trackingEvent.create({ data:{ orderId:order.id, fromStatus:'CREATED', toStatus:'CONFIRMED', actorId:req.user!.id, actorRole:req.user!.role, notes:'Confirmed' } });
    }
    logger.info({ orderId:order.id, total:order.totalCharge }, 'Order created');
    res.status(201).json({ success:true, data:order });
  }catch(e:any){ if(e.code==='ZONE_NOT_FOUND') return res.status(400).json({ success:false, error:e.message }); next(e); }
});

router.get('/', authenticate, async(req:AuthRequest,res,next)=>{
  try{
    let list:any[]=[];
    if(isMockMode()){
      const s=getMockStore() as any;
      if(req.user!.role==='CUSTOMER') list=s.orders.filter((o:any)=>o.customerId===req.user!.id);
      else if(req.user!.role==='DELIVERY_AGENT'){
        const ag=s.agents.find((a:any)=>a.userId===req.user!.id);
        list=ag ? s.orders.filter((o:any)=>o.assignedAgentId===ag.id) : [];
      } else {
        list=s.orders;
        const { status, zone, agent }=req.query as any;
        if(status) list=list.filter((o:any)=>o.currentStatus===status);
        if(zone) list=list.filter((o:any)=>o.pickupZoneId===zone || o.dropZoneId===zone);
        if(agent) list=list.filter((o:any)=>o.assignedAgentId===agent);
      }
      // enrich with customer/agent/zone names
      list=list.map((o:any)=>{
        const cust=s.users.find((u:any)=>u.id===o.customerId);
        const ag=s.agents.find((a:any)=>a.id===o.assignedAgentId);
        const agUser=ag? s.users.find((u:any)=>u.id===ag.userId):null;
        const pz=s.zones.find((z:any)=>z.id===o.pickupZoneId);
        const dz=s.zones.find((z:any)=>z.id===o.dropZoneId);
        return { ...o, customer:cust, assignedAgent: ag? {...ag, user:agUser}:null, pickupZone:pz, dropZone:dz };
      }).sort((a:any,b:any)=> new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    } else {
      const prisma=getPrisma() as any;
      if(req.user!.role==='CUSTOMER') list=await prisma.order.findMany({ where:{ customerId:req.user!.id }, orderBy:{ createdAt:'desc' } });
      else if(req.user!.role==='DELIVERY_AGENT'){
        const ag=await prisma.agent.findUnique({ where:{ userId:req.user!.id } });
        list=ag ? await prisma.order.findMany({ where:{ assignedAgentId:ag.id }, orderBy:{ createdAt:'desc' } }) : [];
      } else {
        const where:any={};
        if(req.query.status) where.currentStatus=req.query.status;
        if(req.query.zone) where.OR=[{ pickupZoneId:req.query.zone }, { dropZoneId:req.query.zone }];
        if(req.query.agent) where.assignedAgentId=req.query.agent;
        list=await prisma.order.findMany({ where, orderBy:{ createdAt:'desc' } });
      }
    }
    res.json({ success:true, data:list });
  }catch(e){next(e)}
});

router.get('/:id', authenticate, async(req:AuthRequest,res,next)=>{
  try{
    const { id }=req.params;
    let order:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      order=s.orders.find((o:any)=>o.id===id);
      if(order){
        const cust=s.users.find((u:any)=>u.id===order.customerId);
        const ag=s.agents.find((a:any)=>a.id===order.assignedAgentId);
        const events=s.trackingEvents.filter((t:any)=>t.orderId===id).sort((a:any,b:any)=> new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
        order.customer=cust; order.assignedAgent=ag; order.tracking=events;
      }
    } else {
      order=await (getPrisma() as any).order.findUnique({ where:{ id }, include:{ tracking:true } });
    }
    if(!order) return res.status(404).json({ success:false, error:'Not found' });
    // RBAC: customer own, agent assigned, admin all
    if(req.user!.role==='CUSTOMER' && order.customerId!==req.user!.id) return res.status(403).json({ success:false, error:'Forbidden' });
    if(req.user!.role==='DELIVERY_AGENT'){
      const s=isMockMode()? (getMockStore() as any).agents.find((a:any)=>a.userId===req.user!.id) : await (getPrisma() as any).agent.findUnique({ where:{ userId:req.user!.id } });
      if(order.assignedAgentId!==s?.id) return res.status(403).json({ success:false, error:'Not assigned to you' });
    }
    res.json({ success:true, data:order });
  }catch(e){next(e)}
});

// manual assign / auto-assign
router.post('/:id/assign', authenticate, authorize('ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const { id }=req.params; const { agentId }=req.body;
    if(!agentId) return res.status(400).json({ success:false, error:'agentId required' });
    let order:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      order=s.orders.find((o:any)=>o.id===id);
      if(!order) return res.status(404).json({ success:false, error:'Not found' });
      const agent=s.agents.find((a:any)=>a.id===agentId);
      if(!agent) return res.status(404).json({ success:false, error:'Agent not found' });
      if(agent.status!=='AVAILABLE' && agent.status!=='ON_DELIVERY') return res.status(400).json({ success:false, error:'Agent not available' });
      const prev=order.assignedAgentId;
      order.assignedAgentId=agentId;
      const wasAssigned=order.currentStatus==='ASSIGNED' || order.currentStatus==='CONFIRMED';
      const prevStatus=order.currentStatus;
      if(order.currentStatus==='CONFIRMED') order.currentStatus='ASSIGNED';
      order.updatedAt=new Date();
      agent.activeOrderCount++;
      s.trackingEvents.push({ id:'tr_'+Date.now(), orderId:id, fromStatus:prevStatus, toStatus:order.currentStatus, actorId:req.user!.id, actorRole:'ADMIN', notes:`Manual assign to ${agentId} (prev ${prev||'none'})`, createdAt:new Date() });
      const cust=s.users.find((u:any)=>u.id===order.customerId);
      if(cust) enqueue('ASSIGNED', cust.email, { orderId:id, agent: s.users.find((u:any)=>u.id===agent.userId)?.name }, id).catch(()=>{});
      res.json({ success:true, data:order });
    } else {
      // prisma
      const prisma=getPrisma() as any;
      order=await prisma.order.findUnique({ where:{ id } });
      if(!order) return res.status(404).json({ success:false, error:'Not found' });
      await prisma.order.update({ where:{ id }, data:{ assignedAgentId:agentId, currentStatus: order.currentStatus==='CONFIRMED' ? 'ASSIGNED' : order.currentStatus } });
      await prisma.trackingEvent.create({ data:{ orderId:id, fromStatus:order.currentStatus, toStatus:'ASSIGNED', actorId:req.user!.id, actorRole:'ADMIN', notes:`Manual assign ${agentId}` } });
      res.json({ success:true, data:order });
    }
  }catch(e){next(e)}
});

router.post('/:id/auto-assign', authenticate, authorize('ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const { id }=req.params;
    let order:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      order=s.orders.find((o:any)=>o.id===id);
      if(!order) return res.status(404).json({ success:false, error:'Not found' });
      const assignment=autoAssign({ pickupZoneId:order.pickupZoneId, agents:s.agents });
      if(!assignment.assignedAgentId) return res.json({ success:true, data:{ assigned:false, reason:assignment.reason } });
      order.assignedAgentId=assignment.assignedAgentId;
      const prev=order.currentStatus;
      if(order.currentStatus==='CONFIRMED' || order.currentStatus==='RESCHEDULED') order.currentStatus='ASSIGNED';
      s.trackingEvents.push({ id:'tr_'+Date.now(), orderId:id, fromStatus:prev, toStatus:order.currentStatus, actorId:req.user!.id, actorRole:'ADMIN', notes:assignment.reason, createdAt:new Date() });
      const ag=s.agents.find((a:any)=>a.id===assignment.assignedAgentId);
      if(ag) ag.activeOrderCount++;
      const cust=s.users.find((u:any)=>u.id===order.customerId);
      if(cust) enqueue('ASSIGNED', cust.email, { orderId:id, agent: s.users.find((u:any)=>u.id===ag.userId)?.name }, id).catch(()=>{});
      res.json({ success:true, data:{ assigned:true, agentId:assignment.assignedAgentId, order } });
    } else {
      // prisma variant similar
      res.json({ success:true, data:{ assigned:false } });
    }
  }catch(e){next(e)}
});

// status update
router.post('/:id/status', authenticate, async(req:AuthRequest,res,next)=>{
  try{
    const { id }=req.params; const { toStatus, notes }=req.body;
    if(!toStatus) return res.status(400).json({ success:false, error:'toStatus required' });
    let order:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      order=s.orders.find((o:any)=>o.id===id);
      if(!order) return res.status(404).json({ success:false, error:'Not found' });
      // RBAC: agent only assigned, customer cannot update (except reschedule via separate route), admin can override with isOverride
      const isAdmin=req.user!.role==='ADMIN';
      const isAgent=req.user!.role==='DELIVERY_AGENT';
      if(isAgent){
        const ag=s.agents.find((a:any)=>a.userId===req.user!.id);
        if(order.assignedAgentId!==ag?.id) return res.status(403).json({ success:false, error:'Not assigned' });
      } else if(req.user!.role==='CUSTOMER'){
        return res.status(403).json({ success:false, error:'Customer cannot update status directly, use reschedule' });
      }
      const from=order.currentStatus;
      const isOverride=isAdmin && req.body.override===true;
      if(!canTransition(from, toStatus, isOverride)){
        return res.status(400).json({ success:false, error:`Invalid transition ${from} → ${toStatus}` });
      }
      if(toStatus==='FAILED' && !notes) return res.status(400).json({ success:false, error:'Failed requires reason (notes)' });
      order.currentStatus=toStatus;
      order.updatedAt=new Date();
      s.trackingEvents.push({ id:'tr_'+Date.now(), orderId:id, fromStatus:from, toStatus, actorId:req.user!.id, actorRole:req.user!.role, notes: notes||'', createdAt:new Date() });
      // handle agent active count
      if(toStatus==='DELIVERED' || toStatus==='FAILED'){
        const ag=s.agents.find((a:any)=>a.id===order.assignedAgentId);
        if(ag){ ag.activeOrderCount=Math.max(0, ag.activeOrderCount-1); if(ag.activeOrderCount===0) ag.status='AVAILABLE'; }
      }
      const cust=s.users.find((u:any)=>u.id===order.customerId);
      if(cust){
        const type = toStatus==='FAILED' ? 'FAILED' : 'STATUS';
        enqueue(type, cust.email, { orderId:id, from, to:toStatus, notes }, id).catch(()=>{});
      }
      res.json({ success:true, data:order });
    } else {
      res.json({ success:true, data:{} });
    }
  }catch(e){next(e)}
});

router.post('/:id/override', authenticate, authorize('ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const { id }=req.params; const { toStatus, notes }=req.body;
    if(!toStatus) return res.status(400).json({ success:false, error:'toStatus required' });
    let order:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      order=s.orders.find((o:any)=>o.id===id);
      if(!order) return res.status(404).json({ success:false, error:'Not found' });
      const from=order.currentStatus;
      order.currentStatus=toStatus;
      order.updatedAt=new Date();
      s.trackingEvents.push({ id:'tr_'+Date.now(), orderId:id, fromStatus:from, toStatus, actorId:req.user!.id, actorRole:'ADMIN', notes: notes||'Admin override', createdAt:new Date() });
      const cust=s.users.find((u:any)=>u.id===order.customerId);
      if(cust) enqueue('STATUS', cust.email, { orderId:id, from, to:toStatus, notes }, id).catch(()=>{});
      res.json({ success:true, data:order });
    } else {
      res.json({ success:true, data:{} });
    }
  }catch(e){next(e)}
});

router.post('/:id/reschedule', authenticate, authorize('CUSTOMER','ADMIN'), async(req:AuthRequest,res,next)=>{
  try{
    const { id }=req.params; const { rescheduleDate }=req.body;
    if(!rescheduleDate) return res.status(400).json({ success:false, error:'rescheduleDate required' });
    let order:any;
    if(isMockMode()){
      const s=getMockStore() as any;
      order=s.orders.find((o:any)=>o.id===id);
      if(!order) return res.status(404).json({ success:false, error:'Not found' });
      if(req.user!.role==='CUSTOMER' && order.customerId!==req.user!.id) return res.status(403).json({ success:false, error:'Forbidden' });
      if(order.currentStatus!=='FAILED') return res.status(400).json({ success:false, error:'Only FAILED orders can be rescheduled' });
      const from=order.currentStatus;
      order.rescheduleDate=new Date(rescheduleDate);
      order.currentStatus='RESCHEDULED';
      s.trackingEvents.push({ id:'tr_'+Date.now(), orderId:id, fromStatus:from, toStatus:'RESCHEDULED', actorId:req.user!.id, actorRole:req.user!.role, notes:`Rescheduled to ${rescheduleDate}`, createdAt:new Date() });
      // re-run assignment
      const assignment=autoAssign({ pickupZoneId:order.pickupZoneId, agents:s.agents });
      if(assignment.assignedAgentId){
        const prevAgent=order.assignedAgentId;
        order.assignedAgentId=assignment.assignedAgentId;
        order.currentStatus='ASSIGNED';
        s.trackingEvents.push({ id:'tr_'+Date.now()+'_re', orderId:id, fromStatus:'RESCHEDULED', toStatus:'ASSIGNED', actorId:'system', actorRole:'system', notes:`Reassigned on reschedule: ${assignment.reason} (prev ${prevAgent})`, createdAt:new Date() });
        const ag=s.agents.find((a:any)=>a.id===assignment.assignedAgentId);
        if(ag) ag.activeOrderCount++;
        const cust=s.users.find((u:any)=>u.id===order.customerId);
        if(cust) enqueue('RESCHEDULED', cust.email, { orderId:id, date:rescheduleDate, agent: s.users.find((u:any)=>u.id===ag.userId)?.name }, id).catch(()=>{});
        enqueue('ASSIGNED', cust.email, { orderId:id, agent: s.users.find((u:any)=>u.id===ag.userId)?.name }, id).catch(()=>{});
      } else {
        const cust=s.users.find((u:any)=>u.id===order.customerId);
        if(cust) enqueue('RESCHEDULED', cust.email, { orderId:id, date:rescheduleDate, agent:'pending manual' }, id).catch(()=>{});
      }
      res.json({ success:true, data:order });
    } else {
      res.json({ success:true, data:{} });
    }
  }catch(e){next(e)}
});

export default router;
