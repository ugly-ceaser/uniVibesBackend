import { app, container } from './app';
import { env } from './config/env';
import cors from 'cors';

// CORS
app.use(cors({
  origin: env.corsOrigins,
  credentials: true,
}));

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  try {
    const prisma = container.resolve('prisma');
    const redis = container.resolve('redis');
    await prisma.$disconnect();
    await redis.quit();
  } catch (err) {
    // ignore errors during shutdown
  } finally {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
