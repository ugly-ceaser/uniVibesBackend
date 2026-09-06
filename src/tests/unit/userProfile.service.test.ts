import { createProfileService } from '../../modules/user/userProfile.service';

describe('UserProfileService Security', () => {
  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('strips password hash from getProfile response', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u123',
      email: 'student@example.com',
      username: 'student123',
      password: '$2a$10$hashedPasswordValue',
      role: 'STUDENT',
    });

    const service = createProfileService(mockPrisma);
    const profile = await service.getProfile('u123');

    expect(profile).toBeDefined();
    expect(profile?.email).toBe('student@example.com');
    expect((profile as any).password).toBeUndefined();
  });

  it('strips password hash from updateProfile response', async () => {
    mockPrisma.user.update.mockResolvedValue({
      id: 'u123',
      email: 'student@example.com',
      username: 'student123',
      fullname: 'Updated Name',
      password: '$2a$10$hashedPasswordValue',
      role: 'STUDENT',
    });

    const service = createProfileService(mockPrisma);
    const profile = await service.updateProfile('u123', { fullname: 'Updated Name' });

    expect(profile).toBeDefined();
    expect(profile.fullname).toBe('Updated Name');
    expect((profile as any).password).toBeUndefined();
  });
});
