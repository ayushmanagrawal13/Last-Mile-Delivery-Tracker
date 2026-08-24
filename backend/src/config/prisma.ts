import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';
let prisma: PrismaClient;
export function getPrisma(): PrismaClient {
  if (!prisma) prisma = new PrismaClient({ log: env.NODE_ENV === 'development' ? ['warn','error'] : ['error'] });
  return prisma;
}
type MockStore = {
  users: any[];
  zones: any[];
  zoneAreas: any[];
  rateCards: any[];
  codConfigs: any[];
  agents: any[];
  orders: any[];
  trackingEvents: any[];
  notificationLogs: any[];
};
const mockStore: MockStore = {
  users: [], zones: [], zoneAreas: [], rateCards: [], codConfigs: [], agents: [], orders: [], trackingEvents: [], notificationLogs: [],
};
export function isMockMode(): boolean {
  if (env.USE_MOCK_DB) return true;
  if (!env.DATABASE_URL || env.DATABASE_URL.includes('user:password@localhost')) return true;
  return false;
}
export function getMockStore(): MockStore { return mockStore; }
export async function testDbConnection(): Promise<boolean> {
  if (isMockMode()) return false;
  try { const p=getPrisma(); await p.$queryRaw`SELECT 1`; logger.info('Postgres connected'); return true; } catch(e){ logger.warn({err:e},'PG fail fallback mock'); return false; }
}
