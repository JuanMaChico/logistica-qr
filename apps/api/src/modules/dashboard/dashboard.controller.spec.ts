import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockService = {
    getStats: jest.fn(),
    getEquipmentByCategory: jest.fn(),
    getEventsByMonth: jest.fn(),
    getTopEquipment: jest.fn(),
  };

  const mockUser = { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'owner' as const, phone: null, orgId: 'org-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getStats should delegate to service', async () => {
    mockService.getStats.mockResolvedValue({ totalEquipment: 5 });
    const result = await controller.getStats(mockUser);
    expect(result).toEqual({ totalEquipment: 5 });
    expect(mockService.getStats).toHaveBeenCalledWith('org-1');
  });

  it('getEquipmentByCategory should delegate to service', async () => {
    mockService.getEquipmentByCategory.mockResolvedValue([{ category: 'speaker', count: 3 }]);
    const result = await controller.getEquipmentByCategory(mockUser);
    expect(result).toEqual([{ category: 'speaker', count: 3 }]);
    expect(mockService.getEquipmentByCategory).toHaveBeenCalledWith('org-1');
  });

  it('getEventsByMonth should delegate to service with parsed months', async () => {
    mockService.getEventsByMonth.mockResolvedValue([{ month: '2026-07', count: 2 }]);
    const result = await controller.getEventsByMonth(mockUser, '3');
    expect(result).toEqual([{ month: '2026-07', count: 2 }]);
    expect(mockService.getEventsByMonth).toHaveBeenCalledWith('org-1', 3);
  });

  it('getEventsByMonth should fall back to 6 months on invalid input', async () => {
    mockService.getEventsByMonth.mockResolvedValue([]);
    await controller.getEventsByMonth(mockUser, 'abc');
    expect(mockService.getEventsByMonth).toHaveBeenCalledWith('org-1', 6);
  });

  it('getTopEquipment should delegate to service with parsed limit', async () => {
    mockService.getTopEquipment.mockResolvedValue([{ id: 'eq-1', name: 'JBL', qrCode: 'EQ-PAR-001', timesUsed: 4 }]);
    const result = await controller.getTopEquipment(mockUser, '10');
    expect(result).toHaveLength(1);
    expect(mockService.getTopEquipment).toHaveBeenCalledWith('org-1', 10);
  });

  it('getTopEquipment should fall back to 5 on invalid input', async () => {
    mockService.getTopEquipment.mockResolvedValue([]);
    await controller.getTopEquipment(mockUser, 'abc');
    expect(mockService.getTopEquipment).toHaveBeenCalledWith('org-1', 5);
  });
});
