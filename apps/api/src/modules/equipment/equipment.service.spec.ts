import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { PrismaService } from '../prisma/prisma.service';
import { generateQrCode } from '../../common/utils/qr';

jest.mock('../../common/utils/qr', () => ({
  generateQrCode: jest.fn().mockReturnValue('EQ-PAR-001'),
  generateQrImage: jest.fn().mockResolvedValue('data:image/png;base64,abc123'),
}));

describe('EquipmentService', () => {
  let service: EquipmentService;

  const mockPrisma = {
    equipment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    equipmentLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    rentalItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    rental: {
      update: jest.fn(),
    },
    event: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const orgId = 'org-1';
  const mockEquipment = {
    id: 'eq-1',
    organizationId: orgId,
    qrCode: 'EQ-PAR-001',
    name: 'Parlante JBL',
    category: 'speaker',
    physicalStatus: 'good',
    availabilityStatus: 'available',
    notes: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all equipment in organization', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([mockEquipment]);

      const result = await service.findAll(orgId);

      expect(result).toEqual([mockEquipment]);
      expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const result = await service.findAll(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return equipment by id', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(mockEquipment);

      const result = await service.findOne('eq-1', orgId);

      expect(result).toEqual(mockEquipment);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(null);

      await expect(service.findOne('eq-1', orgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create equipment with QR code and image', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(null);
      mockPrisma.equipment.create.mockResolvedValue(mockEquipment);

      const result = await service.create(
        { name: 'Parlante JBL', category: 'speaker' },
        orgId,
      );

      expect(result.qrImage).toBe('data:image/png;base64,abc123');
      expect(result.qrCode).toBe('EQ-PAR-001');
      expect(mockPrisma.equipment.create).toHaveBeenCalledWith({
        data: {
          name: 'Parlante JBL',
          category: 'speaker',
          qrCode: 'EQ-PAR-001',
          notes: undefined,
          organizationId: orgId,
        },
      });
    });

    it('should create equipment with sequential QR code', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue({
        qrCode: 'EQ-PAR-005',
      });
      mockPrisma.equipment.create.mockResolvedValue(mockEquipment);

      await service.create({ name: 'Parlante', category: 'speaker' }, orgId);

      expect(generateQrCode).toHaveBeenCalledWith('speaker', 6);
    });
  });

  describe('update', () => {
    it('should update equipment', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        name: 'Parlante Actualizado',
      });

      const result = await service.update(
        'eq-1',
        { name: 'Parlante Actualizado' },
        orgId,
      );

      expect(result.name).toBe('Parlante Actualizado');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(null);

      await expect(
        service.update('eq-1', { name: 'Test' }, orgId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete equipment', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.delete.mockResolvedValue(mockEquipment);

      await service.remove('eq-1', orgId);

      expect(mockPrisma.equipment.delete).toHaveBeenCalledWith({ where: { id: 'eq-1' } });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(null);

      await expect(service.remove('eq-1', orgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLogs', () => {
    it('should return equipment logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          equipmentId: 'eq-1',
          eventId: 'evt-1',
          reason: 'Rotura durante evento',
          registeredById: 'user-1',
          createdAt: new Date(),
          event: { id: 'evt-1', name: 'Evento Test' },
          registrar: { id: 'user-1', name: 'Admin' },
        },
      ];

      mockPrisma.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrisma.equipmentLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getLogs('eq-1', orgId);

      expect(result).toEqual(mockLogs);
      expect(mockPrisma.equipmentLog.findMany).toHaveBeenCalledWith({
        where: { equipmentId: 'eq-1' },
        include: {
          event: { select: { id: true, name: true } },
          registrar: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true, qrCode: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(null);

      await expect(service.getLogs('eq-1', orgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('retire', () => {
    // The interactive transaction runs the callback against the tx client; in tests
    // tx is the same mockPrisma.
    const runTransaction = () =>
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrisma) => unknown) => cb(mockPrisma),
      );

    it('should retire equipment and create log', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        availabilityStatus: 'retired',
      });
      mockPrisma.rentalItem.findFirst.mockResolvedValue(null);
      runTransaction();

      const result = await service.retire(
        'eq-1',
        { reason: 'Equipo roto durante evento', eventId: 'evt-1' },
        'user-1',
        orgId,
      );

      expect(result.availabilityStatus).toBe('retired');
      expect(mockPrisma.equipmentLog.create).toHaveBeenCalled();
      // No open rental item → no rental/event transition
      expect(mockPrisma.rentalItem.update).not.toHaveBeenCalled();
      expect(mockPrisma.event.update).not.toHaveBeenCalled();
    });

    it('should resolve the open rental item and mark the event partial when items remain', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        availabilityStatus: 'retired',
      });
      mockPrisma.rentalItem.findFirst.mockResolvedValue({
        id: 'item-1',
        rentalId: 'rental-1',
        equipmentId: 'eq-1',
        scannedInAt: null,
        rental: {
          id: 'rental-1',
          eventId: 'evt-1',
          items: [
            { id: 'item-1', scannedInAt: null },
            { id: 'item-2', scannedInAt: null },
          ],
        },
      });
      runTransaction();

      await service.retire(
        'eq-1',
        { reason: 'Extraviado durante el evento', eventId: 'evt-1' },
        'user-1',
        orgId,
      );

      expect(mockPrisma.rentalItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: expect.objectContaining({ returnCondition: 'damaged' }),
        }),
      );
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { status: 'partial_return' },
      });
      expect(mockPrisma.rental.update).not.toHaveBeenCalled();
    });

    it('should complete the event when the retired item was the last one pending', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        availabilityStatus: 'retired',
      });
      mockPrisma.rentalItem.findFirst.mockResolvedValue({
        id: 'item-1',
        rentalId: 'rental-1',
        equipmentId: 'eq-1',
        scannedInAt: null,
        rental: {
          id: 'rental-1',
          eventId: 'evt-1',
          items: [{ id: 'item-1', scannedInAt: null }],
        },
      });
      runTransaction();

      await service.retire(
        'eq-1',
        { reason: 'Roto sin reparación', eventId: 'evt-1' },
        'user-1',
        orgId,
      );

      expect(mockPrisma.rental.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rental-1' },
          data: expect.objectContaining({ status: 'returned' }),
        }),
      );
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { status: 'completed' },
      });
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue(null);

      await expect(
        service.retire('eq-1', { reason: 'Roto durante evento', eventId: 'evt-1' }, 'user-1', orgId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already retired', async () => {
      mockPrisma.equipment.findFirst.mockResolvedValue({
        ...mockEquipment,
        availabilityStatus: 'retired',
      });

      await expect(
        service.retire('eq-1', { reason: 'Roto durante evento', eventId: 'evt-1' }, 'user-1', orgId),
      ).rejects.toThrow(ConflictException);
    });
  });
});
