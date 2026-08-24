import { logger } from '../config/logger';
import { sendEmail, template, forceFailNext, setForceFail } from './email';
import { sendSMS } from './sms';
import { isMockMode, getMockStore, getPrisma } from '../config/prisma';
type QueueItem = { type:string; recipient:string; payload:any; channel:'EMAIL'|'SMS'; relatedOrderId?:string; retryCount:number };
const queue: QueueItem[] = [];
export async function enqueue(type:string, recipient:string, payload:any, relatedOrderId?:string, channel:'EMAIL'|'SMS'='EMAIL'){
  const item: QueueItem = { type, recipient, payload, channel, relatedOrderId, retryCount:0 };
  if(isMockMode()){
    const s=getMockStore() as any;
    s.notificationLogs.push({ id:'nl_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), type, recipient, channel, status:'PENDING', retryCount:0, relatedOrderId, payload, createdAt:new Date() });
  } else {
    await (getPrisma() as any).notificationLog.create({ data:{ type, recipient, channel, status:'PENDING', retryCount:0, relatedOrderId, payload } });
  }
  queue.push(item);
  processQueue().catch(()=>{});
  logger.info({ type, recipient, channel }, 'Notification enqueued');
}
async function processQueue(){
  while(queue.length>0){
    const item=queue.shift()!;
    let result:any;
    const { subject, html } = template(item.type, item.payload);
    if(forceFailNext){
      setForceFail(false);
      result={ success:false, error:'Forced failure' };
    } else {
      if(item.channel==='SMS') result=await sendSMS(item.recipient, item.payload.message || subject);
      else result=await sendEmail(item.recipient, subject, html);
    }
    if(result.success){
      updateStatus(item,'SENT',null);
    } else {
      if(item.retryCount<3){
        item.retryCount++;
        const backoff=Math.pow(2,item.retryCount)*1000;
        updateStatus(item,'PENDING',result.error);
        setTimeout(()=>{ queue.push(item); processQueue(); }, backoff);
        logger.warn({ type:item.type, retry:item.retryCount, backoff }, 'Email retry scheduled');
      } else {
        updateStatus(item,'FAILED',result.error);
      }
    }
  }
}
function updateStatus(item:QueueItem, status:string, error:string|null){
  if(isMockMode()){
    const s=getMockStore() as any;
    const log=[...s.notificationLogs].reverse().find((l:any)=>l.recipient===item.recipient && l.type===item.type);
    if(log){ log.status=status; log.retryCount=item.retryCount; if(error) log.error=error; }
  } else {
    const prisma=getPrisma() as any;
    prisma.notificationLog.findFirst({ where:{ recipient:item.recipient, type:item.type }, orderBy:{ createdAt:'desc' } }).then((log:any)=>{
      if(log) prisma.notificationLog.update({ where:{ id:log.id }, data:{ status, retryCount:item.retryCount, error } }).catch(()=>{});
    });
  }
}
export async function retryFailed(){
  if(isMockMode()){
    const s=getMockStore() as any;
    const failed=s.notificationLogs.filter((l:any)=>(l.status==='PENDING'||l.status==='FAILED')&&l.retryCount<3);
    for(const f of failed){
      if(Math.random()>0.5) continue;
      const { subject, html } = template(f.type, f.payload);
      const res=await sendEmail(f.recipient, subject, html);
      if(res.success) f.status='SENT'; else { f.retryCount++; if(f.retryCount>=3) f.status='FAILED'; }
    }
  }
}
