import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pin'),
  compare: jest.fn().mockResolvedValue(false),
}));

describe('EmployeesService', () => {
  let service: EmployeesService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const orgId = 'org-1';
  const mockTechnician = {
    id: 'user-1',
    name: 'Juan Técnico',
    email: 'juan@test.com',
    phone: '123456789',
    role: 'technician',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    mockPrisma.user.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all technicians in the organization', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockTechnician]);

      const result = await service.findAll(orgId);

      expect(result).toEqual([mockTechnician]);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, role: 'technician' },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no technicians', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a technician by id', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTechnician);

      const result = await service.findOne('user-1', orgId);

      expect(result).toEqual(mockTechnician);
    });

    it('should throw NotFoundException when technician not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', orgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a technician with auto-generated PIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockTechnician);

      const result = await service.create(
        { name: 'Juan Técnico', email: 'juan@test.com' },
        orgId,
      );

      expect(result).toMatchObject({ ...mockTechnician, pin: expect.any(String) });
      expect(result.pin).toHaveLength(4);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should create a technician with provided PIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockTechnician);

      const result = await service.create(
        { name: 'Juan Técnico', pin: '4321' },
        orgId,
      );

      expect(result.pin).toBe('4321');
    });

    it('should throw ConflictException if email already exists in same org', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTechnician,
        organizationId: orgId,
      });

      await expect(
        service.create({ name: 'Juan', email: 'juan@test.com' }, orgId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email already exists in other org', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTechnician,
        organizationId: 'other-org',
      });

      await expect(
        service.create({ name: 'Juan', email: 'juan@test.com' }, orgId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if provided PIN is already taken by a technician in another org', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findMany.mockResolvedValue([
        { pin: 'hashed-existing-pin' },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        service.create({ name: 'Juan Técnico', pin: '4321' }, orgId),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should retry auto-generated PIN if the first candidate collides', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockTechnician);
      mockPrisma.user.findMany.mockResolvedValue([{ pin: 'hashed-existing-pin' }]);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.create({ name: 'Juan Técnico' }, orgId);

      expect(result.pin).toHaveLength(4);
      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(2);
    });

    it('should create technician without email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...mockTechnician, email: null });

      const result = await service.create({ name: 'Juan Técnico' }, orgId);

      expect(result).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: null,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a technician', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTechnician);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({
        ...mockTechnician,
        name: 'Juan Updated',
      });

      const result = await service.update(
        'user-1',
        { name: 'Juan Updated' },
        orgId,
      );

      expect(result.name).toBe('Juan Updated');
    });

    it('should throw NotFoundException when updating non-existent technician', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', { name: 'Test' }, orgId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on email conflict', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTechnician);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'other-user', email: 'other@test.com' });

      await expect(
        service.update('user-1', { email: 'other@test.com' }, orgId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if new PIN is already taken by another technician', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTechnician);
      mockPrisma.user.findMany.mockResolvedValue([{ pin: 'hashed-other-pin' }]);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        service.update('user-1', { pin: '9999' }, orgId),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should exclude the technician being updated from its own PIN collision check', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTechnician);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.update.mockResolvedValue({ ...mockTechnician });

      await service.update('user-1', { pin: '9999' }, orgId);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'user-1' } }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a technician', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTechnician);
      mockPrisma.user.delete.mockResolvedValue(mockTechnician);

      await service.remove('user-1', orgId);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('should throw NotFoundException when deleting non-existent technician', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', orgId)).rejects.toThrow(NotFoundException);
    });
  });
});
