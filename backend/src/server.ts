import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error';
import { getPrisma, testDbConnection, isMockMode } from './config/prisma';
import authRoutes from './routes/api/v1/auth';
import zoneRoutes from './routes/api/v1/zones';
import rateRoutes from './routes/api/v1/rateCards';
import agentRoutes from './routes/api/v1/agents';
import orderRoutes from './routes/api/v1/orders';
import { startJobs } from './jobs/worker';

const app=express();
app.use(cors({ origin: env.FRONTEND_URL, credentials:true }));
app.use(express.json());

app.get('/health', (_req,res)=> res.json({ success:true, data:{ status:'ok', mockMode:isMockMode(), timestamp:new Date().toISOString() } }));
app.get('/api/v1/health', (_req,res)=> res.json({ success:true, data:{ status:'ok', version:'v1' } }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/zones', zoneRoutes);
app.use('/api/v1', rateRoutes); // rate-cards and cod-config under /api/v1
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use(errorHandler);

const port=env.PORT;
if(!process.env.VERCEL){
  app.listen(port, async()=>{
    logger.info(`Server listening on ${port} mockMode=${isMockMode()}`);
    if(!isMockMode()){ await testDbConnection(); try{ await getPrisma().$connect(); }catch{} }
    startJobs();
    try{ const { seedIfNeeded }=await import('./seed'); await seedIfNeeded(); }catch(e:any){ logger.warn({err:e.message},'Seed fail'); }
  });
} else {
  (async()=>{
    if(!isMockMode()){ try{ await getPrisma().$connect(); }catch{} }
    try{ const { seedIfNeeded }=await import('./seed'); await seedIfNeeded(); }catch{}
  })();
}
export default app;
