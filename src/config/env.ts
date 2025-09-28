export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://cache:6379',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableResponseLogging: process.env.ENABLE_RESPONSE_LOGGING === 'true' || process.env.NODE_ENV === 'development',
  responseLogLevel: process.env.RESPONSE_LOG_LEVEL || 'detailed', // 'simple', 'detailed', 'none'
    corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
}; 