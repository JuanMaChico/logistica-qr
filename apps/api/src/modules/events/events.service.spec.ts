import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrisma = {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rental: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    rentalItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    equipment: {
      updateMany: jest.fn(),
    },
    equipmentLog: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>): Promise<unknown> => callback(mockPrisma)),
  };

  const orgId = 'org-1';
  const userId = 'user-1';
  const mockEvent = {
    id: 'evt-1',
    organizationId: orgId,
    name: 'Fiesta de prueba',
    type: 'party',
    clientName: 'Cliente Test',
    clientPhone: '123456789',
    clientAddress: 'Calle Falsa 123',
    departureDate: new Date('2026-08-01'),
    returnDate: new Date('2026-08-02'),
    status: 'pending',
    notes: null,
    createdById: userId,
    createdAt: new Date(),
    createdBy: { id: userId, name: 'Admin' },
    rentals: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all events for owner', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll(userId, 'owner', orgId);

      expect(result).toEqual([mockEvent]);
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId },
        }),
      );
    });

    it('should return only assigned events for technician', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll(userId, 'technician', orgId);

      expect(result).toEqual([mockEvent]);
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: orgId,
            rentals: { some: { technicianId: userId } },
          },
        }),
      );
    });

    it('should return empty array', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId, 'owner', orgId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return event with details', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(mockEvent);

      const result = await service.findOne('evt-1', orgId);

      expect(result).toEqual(mockEvent);
      expect(mockPrisma.event.findFirst).toHaveBeenCalledWith({
        where: { id: 'evt-1', organizationId: orgId },
        include: {
          client: { select: { id: true, name: true, phone: true, email: true } },
          createdBy: { select: { id: true, name: true } },
          rentals: {
            include: {
              technician: { select: { id: true, name: true } },
              items: { include: { equipment: true } },
            },
          },
        },
      });
    });

    it('should find event without orgId filter', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(mockEvent);

      const result = await service.findOne('evt-1');

      expect(result).toEqual(mockEvent);
      expect(mockPrisma.event.findFirst).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(service.findOne('evt-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an event', async () => {
      const dto = {
        name: 'Fiesta de prueba',
        type: 'party' as const,
        clientName: 'Cliente Test',
        departureDate: '2026-08-01T10:00:00Z',
        returnDate: '2026-08-02T10:00:00Z',
      };

      mockPrisma.event.findFirst.mockResolvedValue(null);
      mockPrisma.event.create.mockResolvedValue(mockEvent);

      const result = await service.create(dto, userId, orgId);

      expect(result).toEqual(mockEvent);
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          type: dto.type,
          clientId: undefined,
          clientName: dto.clientName,
          clientPhone: undefined,
          clientAddress: undefined,
          departureDate: new Date(dto.departureDate),
          returnDate: new Date(dto.returnDate),
          notes: undefined,
          createdById: userId,
          organizationId: orgId,
        },
      });
    });

    it('should create event with all optional fields', async () => {
      const dto = {
        name: 'Fiesta de prueba',
        type: 'party' as const,
        clientName: 'Cliente Test',
        clientPhone: '123456789',
        clientAddress: 'Calle Falsa 123',
        departureDate: '2026-08-01T10:00:00Z',
        returnDate: '2026-08-02T10:00:00Z',
        notes: 'Nota opcional',
      };

      mockPrisma.event.findFirst.mockResolvedValue(null);
      mockPrisma.event.create.mockResolvedValue(mockEvent);

      await service.create(dto, userId, orgId);

      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          type: dto.type,
          clientId: undefined,
          clientName: dto.clientName,
          clientPhone: dto.clientPhone,
          clientAddress: dto.clientAddress,
          departureDate: new Date(dto.departureDate),
          returnDate: new Date(dto.returnDate),
          notes: dto.notes,
          createdById: userId,
          organizationId: orgId,
        },
      });
    });

    it('should create an active rental (not reserved) and set event in_progress when equipmentIds are provided', async () => {
      const dto = {
        name: 'Fiesta con equipos',
        type: 'party' as const,
        clientName: 'Cliente Test',
        departureDate: '2026-08-01T10:00:00Z',
        returnDate: '2026-08-02T10:00:00Z',
        equipmentIds: ['eq-1', 'eq-2'],
      };

      mockPrisma.event.findFirst.mockResolvedValue(null);
      mockPrisma.event.create.mockResolvedValue(mockEvent);
      mockPrisma.rental.create.mockResolvedValue({ id: 'rental-1' });
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, status: 'in_progress' });

      const result = await service.create(dto, userId, orgId);

      expect(mockPrisma.rental.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'active' }),
      });
      expect(mockPrisma.rentalItem.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ rentalId: 'rental-1', equipmentId: 'eq-1' }),
          expect.objectContaining({ rentalId: 'rental-1', equipmentId: 'eq-2' }),
        ],
      });
      expect(mockPrisma.equipment.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['eq-1', 'eq-2'] } },
        data: { availabilityStatus: 'rented' },
      });
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
        data: { status: 'in_progress' },
      });
      expect(result.status).toBe('in_progress');
    });

    it('should throw ConflictException when dates overlap with existing event', async () => {
      const dto = {
        name: 'Evento con conflicto',
        type: 'party' as const,
        clientName: 'Cliente Test',
        departureDate: '2026-08-01T10:00:00Z',
        returnDate: '2026-08-03T10:00:00Z',
      };

      mockPrisma.event.findFirst.mockResolvedValue({
        id: 'evt-existing',
        name: 'Evento Existente',
      });

      await expect(service.create(dto, userId, orgId)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update event', async () => {
      mockPrisma.event.findFirst.mockResolvedValueOnce(mockEvent);
      mockPrisma.event.update.mockResolvedValue({
        ...mockEvent,
        name: 'Evento Actualizado',
      });

      const result = await service.update(
        'evt-1',
        { name: 'Evento Actualizado' },
        orgId,
      );

      expect(result.name).toBe('Evento Actualizado');
    });

    it('should update event without overlap check when dates unchanged', async () => {
      mockPrisma.event.findFirst.mockResolvedValueOnce(mockEvent);
      mockPrisma.event.update.mockResolvedValue(mockEvent);

      const result = await service.update(
        'evt-1',
        { name: 'Solo nombre' },
        orgId,
      );

      expect(result).toEqual(mockEvent);
      expect(mockPrisma.event.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when new dates overlap on update', async () => {
      mockPrisma.event.findFirst.mockResolvedValueOnce(mockEvent);
      mockPrisma.event.findFirst.mockResolvedValueOnce({
        id: 'evt-existing',
        name: 'Otro Evento',
      });

      await expect(
        service.update('evt-1', { departureDate: '2026-08-01T10:00:00Z', returnDate: '2026-08-10T10:00:00Z' }, orgId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(
        service.update('evt-1', { name: 'Test' }, orgId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete event without rentals', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(mockEvent);
      mockPrisma.event.delete.mockResolvedValue(mockEvent);

      await service.remove('evt-1', orgId);

      expect(mockPrisma.equipmentLog.updateMany).toHaveBeenCalledWith({
        where: { eventId: 'evt-1' },
        data: { eventId: null },
      });
      expect(mockPrisma.rentalItem.deleteMany).toHaveBeenCalledWith({
        where: { rental: { eventId: 'evt-1' } },
      });
      expect(mockPrisma.rental.deleteMany).toHaveBeenCalledWith({ where: { eventId: 'evt-1' } });
      expect(mockPrisma.equipment.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.event.delete).toHaveBeenCalledWith({ where: { id: 'evt-1' } });
    });

    it('should revert rented equipment to available when event has rentals', async () => {
      const eventWithRentals = {
        ...mockEvent,
        rentals: [
          {
            items: [{ equipmentId: 'eq-1' }, { equipmentId: 'eq-2' }],
          },
        ],
      };
      mockPrisma.event.findFirst.mockResolvedValue(eventWithRentals);
      mockPrisma.event.delete.mockResolvedValue(eventWithRentals);

      await service.remove('evt-1', orgId);

      expect(mockPrisma.equipment.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['eq-1', 'eq-2'] }, availabilityStatus: 'rented' },
        data: { availabilityStatus: 'available' },
      });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(service.remove('evt-1', orgId)).rejects.toThrow(NotFoundException);
    });
  });
});
