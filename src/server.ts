import { app, container } from './app';
import { env } from './config/env';


const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});

const shutdown = async () => {
  // eslint-disable-next-line no-console
  console.log('Shutting down...');
  try {
    const prisma = container.resolve('prisma');
    const redis = container.resolve('redis');
    await prisma.$disconnect();
    await redis.quit();
  } catch (err) {
    // ignore
  } finally {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown); 