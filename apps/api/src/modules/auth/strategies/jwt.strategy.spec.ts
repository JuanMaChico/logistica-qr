import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate payload and return user', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'owner',
      phone: null,
      organizationId: 'org-1',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await strategy.validate({ sub: 'user-1', role: 'owner', orgId: 'org-1' });

    expect(result).toEqual({
      id: 'user-1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'owner',
      phone: null,
      orgId: 'org-1',
    });
  });

  it('should throw UnauthorizedException if user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'user-1', role: 'owner', orgId: 'org-1' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
