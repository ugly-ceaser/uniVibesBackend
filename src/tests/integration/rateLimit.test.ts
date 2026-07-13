import { createRateLimiter } from '../../middlewares/rateLimiter';

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
