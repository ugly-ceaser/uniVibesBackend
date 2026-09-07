import { z } from 'zod';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default(
    process.env.NODE_ENV === 'test' 
      ? 'postgresql://postgres:postgres@localhost:5432/test' 
      : ''
  ).refine((val) => process.env.NODE_ENV === 'test' || val.length > 0, {
    message: "DATABASE_URL is required",
  }),
  REDIS_URL: z.string().default('redis://cache:6379'),
  JWT_SECRET: z.string().default('change_me'),
  JWT_EXPIRES_IN: z.string().default('180d'),
  LOG_LEVEL: z.string().default('info'),
  ENABLE_RESPONSE_LOGGING: z.preprocess((val) => val === 'true', z.boolean().default(false)),
  RESPONSE_LOG_LEVEL: z.enum(['simple', 'detailed', 'none']).default('detailed'),
  CORS_ORIGINS: z.string().default('*').transform((val) => val.split(',')),
  DATABASE_CONNECTION_LIMIT: z.coerce.number().default(5),
  AI_SERVICE_URL: z.string().default('https://api.openai.com/v1'),
  AI_SERVICE_API_KEY: z.string().optional().default(''),
  AI_CACHE_TIMEOUT_MS: z.coerce.number().default(1800000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const validatedEnv = parsed.data;

// Enforce production safeties
if (validatedEnv.NODE_ENV === 'production') {
  if (validatedEnv.JWT_SECRET === 'change_me') {
    console.error('❌ CRITICAL SECURITY ERROR: JWT_SECRET cannot be "change_me" in production mode.');
    process.exit(1);
  }
}

export const env = {
  nodeEnv: validatedEnv.NODE_ENV,
  port: validatedEnv.PORT,
  databaseUrl: validatedEnv.DATABASE_URL,
  redisUrl: validatedEnv.REDIS_URL,
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
  logLevel: validatedEnv.LOG_LEVEL,
  enableResponseLogging: validatedEnv.ENABLE_RESPONSE_LOGGING,
  responseLogLevel: validatedEnv.RESPONSE_LOG_LEVEL,
  corsOrigins: validatedEnv.CORS_ORIGINS,
  databaseConnectionLimit: validatedEnv.DATABASE_CONNECTION_LIMIT,
  aiServiceUrl: validatedEnv.AI_SERVICE_URL,
  aiServiceApiKey: validatedEnv.AI_SERVICE_API_KEY,
  aiCacheTimeoutMs: validatedEnv.AI_CACHE_TIMEOUT_MS,
}; 