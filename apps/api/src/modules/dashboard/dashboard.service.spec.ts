import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrisma = {
    equipment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    event: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    rental: {
      count: jest.fn(),
    },
    rentalItem: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dashboard stats', async () => {
    mockPrisma.equipment.findMany.mockResolvedValue([
      { availabilityStatus: 'available' },
      { availabilityStatus: 'available' },
      { availabilityStatus: 'rented' },
      { availabilityStatus: 'retired' },
    ]);
    mockPrisma.equipment.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    mockPrisma.event.count.mockResolvedValue(2);
    mockPrisma.rental.count.mockResolvedValue(3);

    const result = await service.getStats('org-1');

    expect(result).toEqual({
      totalEquipment: 4,
      available: 2,
      rented: 1,
      damaged: 1,
      inRepair: 0,
      retired: 1,
      activeEvents: 2,
      activeRentals: 3,
    });
  });

  it('should return zeros when no equipment exists', async () => {
    mockPrisma.equipment.findMany.mockResolvedValue([]);
    mockPrisma.equipment.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockPrisma.event.count.mockResolvedValue(0);
    mockPrisma.rental.count.mockResolvedValue(0);

    const result = await service.getStats('org-1');

    expect(result).toEqual({
      totalEquipment: 0,
      available: 0,
      rented: 0,
      damaged: 0,
      inRepair: 0,
      retired: 0,
      activeEvents: 0,
      activeRentals: 0,
    });
  });

  describe('getEquipmentByCategory', () => {
    it('should group equipment count by category', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([
        { category: 'speaker' },
        { category: 'speaker' },
        { category: 'microphone' },
      ]);

      const result = await service.getEquipmentByCategory('org-1');

      expect(result).toEqual([
        { category: 'speaker', count: 2 },
        { category: 'microphone', count: 1 },
      ]);
    });

    it('should return empty array when no equipment exists', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const result = await service.getEquipmentByCategory('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('getEventsByMonth', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return a count per month across the requested range', async () => {
      mockPrisma.event.findMany.mockResolvedValue([
        { createdAt: new Date('2026-07-10T00:00:00.000Z') },
        { createdAt: new Date('2026-08-01T00:00:00.000Z') },
        { createdAt: new Date('2026-08-05T00:00:00.000Z') },
      ]);

      const result = await service.getEventsByMonth('org-1', 2);

      expect(result).toEqual([
        { month: '2026-06', count: 0 },
        { month: '2026-07', count: 1 },
        { month: '2026-08', count: 2 },
      ]);
    });

    it('should return zero counts when no events exist', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await service.getEventsByMonth('org-1', 0);

      expect(result).toEqual([{ month: '2026-08', count: 0 }]);
    });
  });

  describe('getTopEquipment', () => {
    it('should return equipment ranked by usage', async () => {
      mockPrisma.rentalItem.groupBy.mockResolvedValue([
        { equipmentId: 'eq-1', _count: { equipmentId: 5 } },
        { equipmentId: 'eq-2', _count: { equipmentId: 3 } },
      ]);
      mockPrisma.equipment.findMany.mockResolvedValue([
        { id: 'eq-1', name: 'Parlante JBL', qrCode: 'EQ-PAR-001' },
        { id: 'eq-2', name: 'Microfono SM58', qrCode: 'EQ-MIC-001' },
      ]);

      const result = await service.getTopEquipment('org-1', 5);

      expect(result).toEqual([
        { id: 'eq-1', name: 'Parlante JBL', qrCode: 'EQ-PAR-001', timesUsed: 5 },
        { id: 'eq-2', name: 'Microfono SM58', qrCode: 'EQ-MIC-001', timesUsed: 3 },
      ]);
    });

    it('should return empty array when no rental items exist', async () => {
      mockPrisma.rentalItem.groupBy.mockResolvedValue([]);

      const result = await service.getTopEquipment('org-1', 5);

      expect(result).toEqual([]);
      expect(mockPrisma.equipment.findMany).not.toHaveBeenCalled();
    });

    it('should fall back to defaults when equipment lookup is missing a match', async () => {
      mockPrisma.rentalItem.groupBy.mockResolvedValue([
        { equipmentId: 'eq-orphan', _count: { equipmentId: 1 } },
      ]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const result = await service.getTopEquipment('org-1', 5);

      expect(result).toEqual([
        { id: 'eq-orphan', name: 'Desconocido', qrCode: '', timesUsed: 1 },
      ]);
    });
  });
});
