import { Test, TestingModule } from '@nestjs/testing';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './services/rentals.service';

describe('RentalsController', () => {
  let controller: RentalsController;

  const mockService = {
    checkout: jest.fn(),
    checkin: jest.fn(),
    undoCheckout: jest.fn(),
    close: jest.fn(),
  };

  const mockUser = { id: 'user-1', name: 'Tecnico', email: 'tec@test.com', role: 'technician' as const, phone: null, orgId: 'org-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentalsController],
      providers: [{ provide: RentalsService, useValue: mockService }],
    }).compile();

    controller = module.get<RentalsController>(RentalsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('checkout should delegate to service', async () => {
    const dto = { equipmentId: 'eq-1' };
    mockService.checkout.mockResolvedValue({ id: 'item-1' });
    const result = await controller.checkout('evt-1', dto, mockUser);
    expect(result).toEqual({ id: 'item-1' });
    expect(mockService.checkout).toHaveBeenCalledWith('evt-1', dto, 'user-1', 'org-1');
  });

  it('checkin should delegate to service', async () => {
    const dto = { equipmentId: 'eq-1', condition: 'good' as const };
    mockService.checkin.mockResolvedValue({ id: 'item-1', scannedInAt: new Date() });
    const result = await controller.checkin('evt-1', dto, mockUser);
    expect(result).toMatchObject({ id: 'item-1' });
    expect(mockService.checkin).toHaveBeenCalledWith('evt-1', dto, 'org-1');
  });

  it('undoCheckout should delegate to service', async () => {
    mockService.undoCheckout.mockResolvedValue({ id: 'item-1' });
    const result = await controller.undoCheckout('evt-1', 'item-1', mockUser);
    expect(result).toEqual({ id: 'item-1' });
    expect(mockService.undoCheckout).toHaveBeenCalledWith('evt-1', 'item-1', 'org-1');
  });

  it('close should delegate to service', async () => {
    mockService.close.mockResolvedValue({ id: 'evt-1', status: 'completed' });
    const result = await controller.close('evt-1', mockUser);
    expect(result).toMatchObject({ status: 'completed' });
    expect(mockService.close).toHaveBeenCalledWith('evt-1', 'org-1');
  });
});
