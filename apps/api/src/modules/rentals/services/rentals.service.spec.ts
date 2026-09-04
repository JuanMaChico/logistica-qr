import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RentalsService', () => {
  let service: RentalsService;

  const mockPrisma = {
    event: { findFirst: jest.fn(), update: jest.fn() },
    equipment: { findFirst: jest.fn(), update: jest.fn() },
    rental: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    rentalItem: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  };

  const orgId = 'org-1';
  const technicianId = 'tech-1';
  const eventId = 'evt-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    it('should checkout equipment successfully', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'pending' });
      mockPrisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', organizationId: orgId, availabilityStatus: 'available' });
      mockPrisma.rental.findFirst.mockResolvedValue(null);
      mockPrisma.rental.create.mockResolvedValue({ id: 'rental-1', eventId, status: 'active' });
      mockPrisma.rentalItem.create.mockResolvedValue({ id: 'item-1', rentalId: 'rental-1', equipmentId: 'eq-1', scannedOutAt: new Date() });

      const result = await service.checkout(eventId, { equipmentId: 'eq-1' }, technicianId, orgId);

      expect(result).toBeDefined();
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { status: 'in_progress' },
      });
      expect(mockPrisma.equipment.update).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
        data: { availabilityStatus: 'rented' },
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(service.checkout(eventId, { equipmentId: 'eq-1' }, technicianId, orgId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is completed', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'completed' });

      await expect(service.checkout(eventId, { equipmentId: 'eq-1' }, technicianId, orgId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'pending' });
      mockPrisma.equipment.findFirst.mockResolvedValue(null);

      await expect(service.checkout(eventId, { equipmentId: 'eq-1' }, technicianId, orgId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if equipment not available', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'pending' });
      mockPrisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', organizationId: orgId, availabilityStatus: 'rented' });

      await expect(service.checkout(eventId, { equipmentId: 'eq-1' }, technicianId, orgId)).rejects.toThrow(ConflictException);
    });

    it('should reuse existing active rental', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'pending' });
      mockPrisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', organizationId: orgId, availabilityStatus: 'available' });
      mockPrisma.rental.findFirst.mockResolvedValue({ id: 'rental-1', eventId, status: 'active' });
      mockPrisma.rentalItem.create.mockResolvedValue({ id: 'item-1', rentalId: 'rental-1', equipmentId: 'eq-1', scannedOutAt: new Date() });

      await service.checkout(eventId, { equipmentId: 'eq-1' }, technicianId, orgId);

      expect(mockPrisma.rental.create).not.toHaveBeenCalled();
    });
  });

  describe('checkin', () => {
    it('should checkin equipment successfully', async () => {
      const item = { id: 'item-1', equipmentId: 'eq-1', scannedOutAt: new Date(), scannedInAt: null as Date | null };
      const rental = { id: 'rental-1', status: 'active', eventId, items: [item] };

      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'in_progress' });
      mockPrisma.rental.findFirst.mockResolvedValue(rental);
      mockPrisma.rentalItem.update.mockResolvedValue({ ...item, scannedInAt: new Date() });

      const result = await service.checkin(eventId, { equipmentId: 'eq-1' }, orgId);

      expect(result).toBeDefined();
      expect(mockPrisma.equipment.update).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
        data: { availabilityStatus: 'available', physicalStatus: 'good' },
      });
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { status: 'completed' },
      });
      expect(mockPrisma.rental.update).toHaveBeenCalledWith({
        where: { id: 'rental-1' },
        data: { status: 'returned', actualReturnDate: expect.any(Date) },
      });
    });

    it('should mark partial return when not all items returned', async () => {
      const item1 = { id: 'item-1', equipmentId: 'eq-1', scannedOutAt: new Date(), scannedInAt: null as Date | null };
      const item2 = { id: 'item-2', equipmentId: 'eq-2', scannedOutAt: new Date(), scannedInAt: null as Date | null };
      const rental = { id: 'rental-1', status: 'active', eventId, items: [item1, item2] };

      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'in_progress' });
      mockPrisma.rental.findFirst.mockResolvedValue(rental);
      mockPrisma.rentalItem.update.mockResolvedValue(item1);

      await service.checkin(eventId, { equipmentId: 'eq-1' }, orgId);

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { status: 'partial_return' },
      });
    });

    it('should mark equipment as damaged on checkin', async () => {
      const item = { id: 'item-1', equipmentId: 'eq-1', scannedOutAt: new Date(), scannedInAt: null as Date | null };
      const rental = { id: 'rental-1', status: 'active', eventId, items: [item] };

      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'in_progress' });
      mockPrisma.rental.findFirst.mockResolvedValue(rental);
      mockPrisma.rentalItem.update.mockResolvedValue(item);

      await service.checkin(eventId, { equipmentId: 'eq-1', condition: 'damaged' }, orgId);

      expect(mockPrisma.equipment.update).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
        data: { availabilityStatus: 'available', physicalStatus: 'damaged' },
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(service.checkin(eventId, { equipmentId: 'eq-1' }, orgId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no active rental', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'in_progress' });
      mockPrisma.rental.findFirst.mockResolvedValue(null);

      await expect(service.checkin(eventId, { equipmentId: 'eq-1' }, orgId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if equipment not scanned out', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId, status: 'in_progress' });
      mockPrisma.rental.findFirst.mockResolvedValue({ id: 'rental-1', status: 'active', eventId, items: [] });

      await expect(service.checkin(eventId, { equipmentId: 'eq-1' }, orgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('close', () => {
    it('should close event with all items returned', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId });
      mockPrisma.rental.findFirst.mockResolvedValue({
        id: 'rental-1', status: 'active',
        items: [{ id: 'item-1', scannedOutAt: new Date(), scannedInAt: new Date() }],
      });

      const result = await service.close(eventId, orgId);

      expect(result).toEqual({ message: 'Evento cerrado correctamente' });
      expect(mockPrisma.rental.update).toHaveBeenCalledWith({
        where: { id: 'rental-1' },
        data: { status: 'returned', actualReturnDate: expect.any(Date) },
      });
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { status: 'completed' },
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(service.close(eventId, orgId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no active rental', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId });
      mockPrisma.rental.findFirst.mockResolvedValue(null);

      await expect(service.close(eventId, orgId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if items still pending', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({ id: eventId, organizationId: orgId });
      mockPrisma.rental.findFirst.mockResolvedValue({
        id: 'rental-1', status: 'active',
        items: [{ id: 'item-1', scannedOutAt: new Date(), scannedInAt: null }],
      });

      await expect(service.close(eventId, orgId)).rejects.toThrow(BadRequestException);
    });
  });
});
