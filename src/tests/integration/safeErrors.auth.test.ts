import request from 'supertest';
import { asValue } from 'awilix';
import { Prisma } from '@prisma/client';

const DB_UNAVAILABLE_MESSAGE = 'UniVibe is temporarily unavailable. Please try again shortly.';

const validRegister = {
  email: 'new@example.com',
  username: 'newstudent',
  firstname: 'New',
  lastname: 'Student',
  password: 'Password123!',
};

const existingUser = {
  id: 'user_1',
  email: 'new@example.com',
  username: 'newstudent',
  password: 'hashed',
};

// Fresh module registry per call: fresh app, logger and auth limiter (keep each app under 10 auth calls).
// Must be called while NODE_ENV is still 'test', so env.ts does not run its production checks.
const loadApp = () => {
  let loaded!: typeof import('../../app');
  let loggerModule!: typeof import('../../config/logger');
  jest.isolateModules(() => {
    // Silence the handler's server-side logging in the same isolated registry as the app.
    loggerModule = require('../../config/logger');
    jest.spyOn(loggerModule.logger, 'error').mockImplementation((() => loggerModule.logger) as any);
    loaded = require('../../app');
  });
  const { app, container } = loaded;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(async () => null),
      create: jest.fn(async ({ data }: any) => ({ id: 'user_1', createdAt: new Date(), updatedAt: new Date(), ...data })),
      update: jest.fn(async ({ data }: any) => ({ id: 'user_1', ...data })),
    },
  };
  container.register({ prisma: asValue(mockPrisma) });
  return { app, mockPrisma };
};

describe('AC-6: auth messages survive safe mode (real app)', () => {
  jest.setTimeout(30000);
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('unknown email on login returns 401 Invalid credentials', async () => {
    const { app, mockPrisma } = loadApp();
    mockPrisma.user.findUnique.mockResolvedValue(null);
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Request-Id', 'req-1')
      .send({ email: 'nobody@example.com', password: 'x' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ status: 401, message: 'Invalid credentials', requestId: 'req-1' });
  });

  it('register with a taken email returns 409 Email already registered', async () => {
    const { app, mockPrisma } = loadApp();
    mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);
    process.env.NODE_ENV = 'production';

    const res = await request(app).post('/api/v1/auth/register').set('X-Request-Id', 'req-1').send(validRegister);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already registered');
    expect(res.body.requestId).toBe('req-1');
    expect(res.body).not.toHaveProperty('stack');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('register with a taken username returns 409 Username already taken', async () => {
    const { app, mockPrisma } = loadApp();
    mockPrisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existingUser);
    process.env.NODE_ENV = 'production';

    const res = await request(app).post('/api/v1/auth/register').set('X-Request-Id', 'req-1').send(validRegister);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Username already taken');
    expect(res.body.requestId).toBe('req-1');
    expect(res.body).not.toHaveProperty('stack');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('login during a DB outage returns 503 without the DB host', async () => {
    const { app, mockPrisma } = loadApp();
    mockPrisma.user.findUnique.mockRejectedValue(
      new Prisma.PrismaClientInitializationError(
        "Can't reach database server at `db.example.internal:5432`",
        '5.22.0',
        'P1001'
      )
    );
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Request-Id', 'req-1')
      .send({ email: 'nobody@example.com', password: 'x' });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 503, message: DB_UNAVAILABLE_MESSAGE, requestId: 'req-1' });
    expect(res.text).not.toContain('db.example.internal');
  });
});
