import express from 'express';
import request from 'supertest';
import { createRateLimiter, createAuthRateLimiter } from '../../middlewares/rateLimiter';

describe('Rate Limiter Middleware', () => {
  it('should construct rate limiter correctly', () => {
    const mockCall = jest.fn().mockResolvedValue('OK');
    const mockContainer = {
      resolve: jest.fn().mockReturnValue({
        call: mockCall,
      }),
    } as any;

    const limiter = createRateLimiter(mockContainer);

    expect(limiter).toBeDefined();
    expect(typeof limiter).toBe('function');
    expect(mockContainer.resolve).toHaveBeenCalledWith('redis');
  });
});

describe('Auth Rate Limiter Middleware', () => {
  const offlineContainer = () =>
    ({
      resolve: jest.fn().mockReturnValue({
        status: 'connecting',
        call: jest.fn().mockResolvedValue('OK'),
      }),
    }) as any;

  it('builds with MemoryStore when redis is not ready and resolves redis', () => {
    const container = offlineContainer();

    let limiter: any;
    expect(() => {
      limiter = createAuthRateLimiter(container);
    }).not.toThrow();

    expect(typeof limiter).toBe('function');
    expect(container.resolve).toHaveBeenCalledWith('redis');
  });

  it('honours max override and returns the JSON 429 on the 3rd request', async () => {
    const limiter = createAuthRateLimiter(offlineContainer(), { windowMs: 60 * 1000, max: 2 });
    const app = express();
    app.use((req, _res, next) => {
      (req as any).id = 'req-test';
      next();
    });
    app.post('/limited', limiter, (_req, res) => res.status(200).json({ ok: true }));

    const first = await request(app).post('/limited');
    const second = await request(app).post('/limited');
    const third = await request(app).post('/limited');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers['content-type']).toMatch(/application\/json/);
    expect(third.headers['retry-after']).toBeDefined();
    expect(third.body.status).toBe(429);
    expect(Number.isInteger(third.body.retryAfter)).toBe(true);
    expect(third.body.retryAfter).toBeGreaterThanOrEqual(1);
    expect(third.body.retryAfter).toBeLessThanOrEqual(60);
    expect(third.body.message).toBe(`Too many attempts. Try again in ${third.body.retryAfter} seconds.`);
    expect(third.body.requestId).toBe('req-test');
  });

  it('two limiter instances do not share a store (no ERR_ERL_STORE_REUSE)', async () => {
    const container = offlineContainer();
    const app = express();
    app.use(createRateLimiter(container));
    app.post('/x', createAuthRateLimiter(container, { max: 1 }), (_req, res) => res.sendStatus(200));

    expect((await request(app).post('/x')).status).toBe(200);
    expect((await request(app).post('/x')).status).toBe(429);
  });
});
