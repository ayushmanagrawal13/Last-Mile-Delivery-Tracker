import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
let transporter: any = null;
function getTransporter(){
  if (transporter) return transporter;
  if (!env.SMTP_HOST) { transporter = nodemailer.createTransport({ jsonTransport: true } as any); return transporter; }
  transporter = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined });
  return transporter;
}
export async function sendEmail(to: string, subject: string, html: string){
  try{
    const t = getTransporter();
    const info:any = await t.sendMail({ from: env.SMTP_FROM, to, subject, html });
    logger.info({ to, subject, messageId: info.messageId }, 'Email sent');
    const preview = nodemailer.getTestMessageUrl(info);
    if(preview) logger.info({ preview }, 'Ethereal preview');
    return { success:true, messageId: info.messageId || 'stub' };
  } catch(e:any){ logger.error({ err:e.message, to }, 'Email failed'); return { success:false, error:e.message } }
}
export function template(type:string, data:any){
  let subject='Delivery Update';
  let html=`<p>Hello, update: ${type}</p>`;
  if(type==='ORDER_CREATED'){ subject=`Order ${data.orderId} Created`; html=`<h2>Order Created</h2><p>Your order ${data.orderId} from ${data.pickup} to ${data.drop} is created. Total: ₹${data.total}</p>`; }
  else if(type==='ASSIGNED'){ subject=`Agent Assigned for ${data.orderId}`; html=`<h2>Agent Assigned</h2><p>Agent ${data.agent} assigned to order ${data.orderId}</p>`; }
  else if(type==='STATUS'){ subject=`Order ${data.orderId} ${data.to}`; html=`<h2>Status: ${data.to}</h2><p>Order ${data.orderId} moved from ${data.from} to ${data.to}</p><p>${data.notes||''}</p>`; }
  else if(type==='FAILED'){ subject=`Delivery Failed ${data.orderId}`; html=`<h2>Delivery Failed</h2><p>Order ${data.orderId} failed: ${data.reason}. Please reschedule.</p>`; }
  else if(type==='RESCHEDULED'){ subject=`Rescheduled ${data.orderId}`; html=`<h2>Rescheduled to ${data.date}</h2><p>New attempt for ${data.orderId}, reassigned to ${data.agent||'pending'}</p>`; }
  return { subject, html };
}
export let forceFailNext=false;
export function setForceFail(v:boolean){ forceFailNext=v; }
