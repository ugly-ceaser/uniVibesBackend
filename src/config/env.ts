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
  
  // AI Service Configuration
  aiServiceUrl: process.env.AI_SERVICE_URL || 'https://api.openai.com/v1',
  aiServiceApiKey: process.env.AI_SERVICE_API_KEY || '',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 30),
  
  // AI Cost Optimization
  aiCacheTimeoutMs: Number(process.env.AI_CACHE_TIMEOUT_MS || 1800000),
  aiMaxCacheSize: Number(process.env.AI_MAX_CACHE_SIZE || 1000),
  aiDefaultUserMode: process.env.AI_DEFAULT_USER_MODE || 'balanced',
}; 