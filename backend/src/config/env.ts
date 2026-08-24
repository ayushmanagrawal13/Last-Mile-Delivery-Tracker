import dotenv from 'dotenv';
dotenv.config();
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  PORT: parseInt(process.env.PORT || '4001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5174',
  NODE_ENV: process.env.NODE_ENV || 'development',
  USE_MOCK_DB: process.env.USE_MOCK_DB === 'true',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@delivery.local',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  VITE_API_URL: process.env.VITE_API_URL || '',
};
