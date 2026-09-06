import { createAuthService } from '../../modules/auth/auth.service';
import bcrypt from 'bcryptjs';
import { signJwt } from '../../utils/jwt';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn()
}));

jest.mock('../../utils/jwt', () => ({
  signJwt: jest.fn(() => 'fake-jwt-token')
}));

describe('AuthService', () => {
  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ 
      id: 'u1', 
      email: 'a@b.com', 
      fullname: 'Test User',
      role: 'student', 
      password: 'hashed-password' 
    });

    const service = createAuthService(mockPrisma);
    const result = await service.register({ 
      email: 'a@b.com', 
      username: 'testuser',
      firstname: 'Test',
      lastname: 'User',
      password: 'pw', 
      fullname: 'Test User',
      role: 'student' 
    });

    expect(result.user.email).toBe('a@b.com');
    expect(result.token).toBe('fake-jwt-token');
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('pw', 10);
    expect(signJwt).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', role: 'student' }));
  });

  it('fails login with wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'student', password: 'hashed-password' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const service = createAuthService(mockPrisma);

    await expect(service.login({ email: 'a@b.com', password: 'bad' })).rejects.toThrow('Invalid credentials');
  });

  it('rejects administrator role during public registration', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const service = createAuthService(mockPrisma);

    await expect(service.register({
      email: 'admin@example.com',
      username: 'adminuser',
      firstname: 'Admin',
      lastname: 'User',
      password: 'pw',
      role: 'ADMIN' as any
    })).rejects.toThrow('Administrator registration is not allowed through public signup');
  });
});
