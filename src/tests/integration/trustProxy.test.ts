import request from 'supertest';
import { asValue } from 'awilix';

const ENV_KEYS = ['TRUST_PROXY', 'LOG_CLIENT_IP'] as const;
const saved: Record<string, string | undefined> = {};

// "Unset" is '' rather than delete: dotenv does not override a variable that is already present.
const setEnv = (vars: Partial<Record<(typeof ENV_KEYS)[number], string>>) => {
  for (const key of ENV_KEYS) process.env[key] = vars[key] ?? '';
};

type Loaded = {
  app: import('express').Express;
  infoSpy: jest.SpyInstance;
};

// Fresh module registry per call: fresh env, logger, app and MemoryStores.
const loadApp = (): Loaded => {
  let loaded!: typeof import('../../app');
  let loggerModule!: typeof import('../../config/logger');
  let infoSpy!: jest.SpyInstance;
  jest.isolateModules(() => {
    // Same isolated registry as the app below, so the app logs through this spied logger.
    loggerModule = require('../../config/logger');
    infoSpy = jest.spyOn(loggerModule.logger, 'info');
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
  return { app, infoSpy };
};

// Invalid bodies are fine: requests count whatever the response status.
const badLogin = { email: 'nobody@example.com' };
const login = (app: Loaded['app'], xff: string) =>
  request(app).post('/api/v1/auth/login').set('X-Forwarded-For', xff).send(badLogin);

const clientIpLines = (spy: jest.SpyInstance): string[] =>
  spy.mock.calls
    .map((args) => args[0])
    .filter((msg): msg is string => typeof msg === 'string' && msg.startsWith('client-ip '));

describe('TRUST_PROXY', () => {
  jest.setTimeout(30000);

  beforeAll(() => {
    for (const key of ENV_KEYS) saved[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    jest.restoreAllMocks();
  });

  describe('AC-2: startup validation', () => {
    const loadEnv = () => {
      let mod: typeof import('../../config/env') | undefined;
      jest.isolateModules(() => {
        mod = require('../../config/env');
      });
      return mod;
    };

    it('exits with code 1 when TRUST_PROXY=true', () => {
      setEnv({ TRUST_PROXY: 'true' });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as never);

      expect(loadEnv).toThrow('process.exit(1)');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy.mock.calls.flat().join(' ')).toContain('TRUST_PROXY');
    });

    it('does not exit when TRUST_PROXY=2 and exposes env.trustProxy === 2', () => {
      setEnv({ TRUST_PROXY: '2' });
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as never);

      const mod = loadEnv();
      expect(exitSpy).not.toHaveBeenCalled();
      expect(mod!.env.trustProxy).toBe(2);
      expect(mod!.env.logClientIp).toBe(false);
    });
  });

  it('AC-3: off by default; X-Forwarded-For is ignored so all requests share one counter', async () => {
    setEnv({ TRUST_PROXY: '' });
    const { app } = loadApp();
    expect(app.get('trust proxy')).toBe(false);

    // express-rate-limit may console.error ERR_ERL_UNEXPECTED_X_FORWARDED_FOR here; that is expected.
    for (let i = 1; i <= 10; i++) {
      const res = await login(app, `203.0.113.${i}`);
      expect(res.status).not.toBe(429);
    }
    const blocked = await login(app, '203.0.113.99');
    expect(blocked.status).toBe(429);
  });

  it('AC-4: hop count 1 keys on the rightmost X-Forwarded-For entry; spoofed leftmost entries are ignored', async () => {
    setEnv({ TRUST_PROXY: '1' });
    const { app } = loadApp();
    expect(app.get('trust proxy')).toBe(1);

    for (let i = 0; i < 10; i++) {
      const res = await login(app, '203.0.113.1');
      expect(res.status).not.toBe(429);
    }
    const spoofed = await login(app, '6.6.6.6, 203.0.113.1');
    expect(spoofed.status).toBe(429);

    const otherClient = await login(app, '203.0.113.2');
    expect(otherClient.status).not.toBe(429);
  });

  describe('AC-5: client-ip diagnostic log', () => {
    const xff = '198.51.100.7, 203.0.113.1';

    it('logs one client-ip line with ip, ips and raw xff when LOG_CLIENT_IP=true', async () => {
      setEnv({ TRUST_PROXY: '1', LOG_CLIENT_IP: 'true' });
      const { app, infoSpy } = loadApp();
      const stdoutSpy = jest.spyOn(console, 'log');

      const res = await request(app).get('/health').set('X-Forwarded-For', xff);
      expect(res.status).toBe(200);

      const lines = clientIpLines(infoSpy);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('ip=203.0.113.1');
      expect(lines[0]).toContain('ips=203.0.113.1');
      expect(lines[0]).toContain(`xff="${xff}"`);

      // Also on stdout: in production winston only writes to files, Render only shows stdout.
      expect(clientIpLines(stdoutSpy)).toEqual(lines);
    });

    it('truncates a long X-Forwarded-For and escapes quotes', async () => {
      setEnv({ TRUST_PROXY: '1', LOG_CLIENT_IP: 'true' });
      const { app, infoSpy } = loadApp();

      const longXff = `"evil" ${'1'.repeat(2000)}, 203.0.113.1`;
      const res = await request(app).get('/health').set('X-Forwarded-For', longXff);
      expect(res.status).toBe(200);

      const lines = clientIpLines(infoSpy);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('xff="\\"evil\\" 111');
      expect(lines[0]).toContain('...(truncated)"');
      expect(lines[0].length).toBeLessThan(800);
    });

    it('logs no client-ip line when LOG_CLIENT_IP is unset', async () => {
      setEnv({ TRUST_PROXY: '1', LOG_CLIENT_IP: '' });
      const { app, infoSpy } = loadApp();
      const stdoutSpy = jest.spyOn(console, 'log');

      const res = await request(app).get('/health').set('X-Forwarded-For', xff);
      expect(res.status).toBe(200);

      expect(clientIpLines(infoSpy)).toHaveLength(0);
      expect(clientIpLines(stdoutSpy)).toHaveLength(0);
    });
  });
});
