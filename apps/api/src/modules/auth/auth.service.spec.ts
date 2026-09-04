import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-value'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  const mockOrg = {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    users: [
      { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'owner', phone: null },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = {
      organizationName: 'Test Org',
      slug: 'test-org',
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
    };

    it('should register a new organization with owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(mockOrg);

      const result = await service.register(dto);

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe('owner');
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        role: 'owner',
        orgId: 'org-1',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: dto.email });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'existing', slug: dto.slug });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Admin',
        email: 'admin@test.com',
        password: 'hashed-password',
        role: 'owner',
        phone: null,
        organization: { id: 'org-1' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('admin@test.com', 'password123');

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe('admin@test.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('unknown@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'tech@test.com',
        password: null,
        organization: { id: 'org-1' },
      });

      await expect(
        service.login('tech@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        password: 'hashed-password',
        organization: { id: 'org-1' },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('admin@test.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('pinLogin', () => {
    it('should login successfully with valid PIN', async () => {
      const mockUsers = [
        {
          id: 'tech-1',
          name: 'Técnico',
          email: 'tech@test.com',
          password: null,
          pin: 'hashed-pin',
          role: 'technician',
          phone: '123',
          organization: { id: 'org-1' },
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.pinLogin('1234');

      expect(result.token).toBe('jwt-token');
    });

    it('should throw UnauthorizedException if no technician matches', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await expect(service.pinLogin('1234')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if PIN does not match', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'tech-1',
          name: 'Técnico',
          email: null,
          password: null,
          pin: 'hashed-pin',
          role: 'technician',
          phone: null,
          organization: { id: 'org-1' },
        },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.pinLogin('0000')).rejects.toThrow(UnauthorizedException);
    });
  });
});
