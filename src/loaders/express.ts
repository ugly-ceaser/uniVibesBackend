import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { scopePerRequest } from 'awilix-express';
import type { AwilixContainer } from 'awilix';
import { apiRateLimiter } from '../middlewares/rateLimiter';
import { requestId, requestLogger } from '../middlewares/requestLogger';
import { errorHandler, notFoundHandler } from '../middlewares/errorHandler';
import { attachUserIfPresent } from '../middlewares/authMiddleware';
import { conditionalResponseLogger } from '../middlewares/responseLogger';
import { registerRoutes } from '../modules';

export const createExpressApp = (container: AwilixContainer) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestId);
  app.use(requestLogger);
  app.use(conditionalResponseLogger); // 📤 Log all responses in development
  app.use(apiRateLimiter);
  app.use(scopePerRequest(container));
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use(attachUserIfPresent);
  registerRoutes(app, container);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}; 