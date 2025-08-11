import { asFunction, asValue, createContainer, Lifetime } from 'awilix';
import { createPrismaClient } from '../config/database';
import { createRedisClient } from '../config/redis';
import { logger } from '../config/logger';
import { env } from '../config/env';

export type AppDependencies = {
  env: typeof env;
  logger: typeof logger;
  prisma: ReturnType<typeof createPrismaClient>;
  redis: ReturnType<typeof createRedisClient>;
};

export const createAppContainer = () => {
  const container = createContainer<AppDependencies>();

  container.register({
    env: asValue(env),
    logger: asValue(logger),
    prisma: asFunction(createPrismaClient, { lifetime: Lifetime.SINGLETON }),
    redis: asFunction(createRedisClient, { lifetime: Lifetime.SINGLETON })
  });

  return container;
}; 