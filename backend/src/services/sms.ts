import { logger } from '../config/logger';
export async function sendSMS(to:string, message:string){
  // Stub/log-only provider. Swap via env SMS_PROVIDER=twilio
  // To implement Twilio: use twilio(env.TWILIO_SID, env.TWILIO_TOKEN).messages.create({body:message, from:env.TWILIO_FROM, to})
  logger.info({ to, message: message.slice(0,80) }, 'SMS stub sent (log only)');
  return { success:true, sid:'stub-'+Date.now() };
}
