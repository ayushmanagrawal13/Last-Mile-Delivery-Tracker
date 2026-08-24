import cron from 'node-cron';
import { logger } from '../config/logger';
import { retryFailed } from '../services/notifications';
export function startJobs(){
  cron.schedule('* * * * *', async()=>{
    try{ await retryFailed(); } catch(e:any){ logger.error({err:e.message},'retry failed'); }
  });
  logger.info('Background jobs started (email retry every min)');
}
