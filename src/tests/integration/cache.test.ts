import { invalidateCacheKeys } from '../../middlewares/cacheMiddleware';

describe('Cache Invalidation Middleware', () => {
  it('should call scan and del on redis client', async () => {
    const mockScan = jest.fn()
      .mockResolvedValueOnce(['next_cursor', ['cache:1', 'cache:2']])
      .mockResolvedValueOnce(['0', ['cache:3']]);
    const mockDel = jest.fn().mockResolvedValue(true);
    
    const mockRedis = {
      scan: mockScan,
      del: mockDel,
    } as any;

    await invalidateCacheKeys(mockRedis, ['cache:*']);

    expect(mockScan).toHaveBeenCalledTimes(2);
    expect(mockScan).toHaveBeenNthCalledWith(1, '0', 'MATCH', 'cache:*', 'COUNT', 100);
    expect(mockScan).toHaveBeenNthCalledWith(2, 'next_cursor', 'MATCH', 'cache:*', 'COUNT', 100);
    expect(mockDel).toHaveBeenCalledTimes(2);
    expect(mockDel).toHaveBeenNthCalledWith(1, ['cache:1', 'cache:2']);
    expect(mockDel).toHaveBeenNthCalledWith(2, ['cache:3']);
  });
});
