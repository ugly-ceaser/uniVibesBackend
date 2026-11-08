import request from 'supertest';
import { asValue } from 'awilix';

// Each test gets a fresh module registry, so a fresh app and fresh MemoryStores.
const loadApp = () => {
  let loaded: typeof import('../../app');
  jest.isolateModules(() => {
    loaded = require('../../app');
  });
  const { app, container } = loaded!;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(async () => null),
      create: jest.fn(async ({ data }: any) => ({ id: 'user_1', createdAt: new Date(), updatedAt: new Date(), ...data })),
      update: jest.fn(async ({ data }: any) => ({ id: 'user_1', ...data })),
    },
  };
  container.register({ prisma: asValue(mockPrisma) });
  return app;
};

const expectAuthLimitBody = (res: request.Response) => {
  expect(res.status).toBe(429);
  expect(res.headers['retry-after']).toBeDefined();
  expect(res.body.status).toBe(429);
  expect(Number.isInteger(res.body.retryAfter)).toBe(true);
  expect(res.body.retryAfter).toBeGreaterThanOrEqual(1);
  expect(res.body.retryAfter).toBeLessThanOrEqual(900);
  expect(res.body.message).toBe(`Too many attempts. Try again in ${res.body.retryAfter} seconds.`);
};

// Invalid bodies are fine: requests count whatever the response status.
const badLogin = { email: 'nobody@example.com' };

describe('Auth rate limit (login + register)', () => {
  jest.setTimeout(30000);

  it('AC-1: allows 10 login requests, the 11th gets a JSON 429', async () => {
    const app = loadApp();
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/v1/auth/login').send(badLogin);
      expect(res.status).not.toBe(429);
    }
    const blocked = await request(app).post('/api/v1/auth/login').send(badLogin);
    expectAuthLimitBody(blocked);
  });

  it('AC-1b: login and register share one counter per IP', async () => {
    const app = loadApp();
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/v1/auth/register').send({});
      expect(res.status).not.toBe(429);
    }
    const blocked = await request(app).post('/api/v1/auth/login').send(badLogin);
    expectAuthLimitBody(blocked);
  });

  it('AC-2: check-username and /health are not covered by the auth limit', async () => {
    const app = loadApp();
    for (let i = 0; i < 11; i++) {
      await request(app).post('/api/v1/auth/login').send(badLogin);
    }
    expect((await request(app).post('/api/v1/auth/login').send(badLogin)).status).toBe(429);

    const check = await request(app).post('/api/v1/auth/check-username').send({ username: 'someone' });
    expect(check.status).not.toBe(429);

    const health = await request(app).get('/health');
    expect(health.status).not.toBe(429);
  });
});
