import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

describe('EquipmentController', () => {
  let controller: EquipmentController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getLogs: jest.fn(),
    retire: jest.fn(),
  };

  const mockUser = { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'owner', phone: null, orgId: 'org-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [{ provide: EquipmentService, useValue: mockService }],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should delegate to service', async () => {
    mockService.findAll.mockResolvedValue([{ id: 'eq-1', name: 'Parlante' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'eq-1', name: 'Parlante' }]);
    expect(mockService.findAll).toHaveBeenCalledWith('org-1');
  });

  it('findOne should delegate to service', async () => {
    mockService.findOne.mockResolvedValue({ id: 'eq-1' });
    const result = await controller.findOne('eq-1', mockUser);
    expect(result).toEqual({ id: 'eq-1' });
  });

  it('create should delegate to service', async () => {
    const dto = { name: 'Parlante', category: 'speaker' as const };
    mockService.create.mockResolvedValue({ id: 'eq-1', ...dto, qrImage: 'data:img/png' });
    const result = await controller.create(dto, mockUser);
    expect(result).toMatchObject({ id: 'eq-1' });
  });

  it('update should delegate to service', async () => {
    mockService.update.mockResolvedValue({ id: 'eq-1', name: 'Updated' });
    const result = await controller.update('eq-1', { name: 'Updated' }, mockUser);
    expect(result.name).toBe('Updated');
  });

  it('remove should delegate to service', async () => {
    mockService.remove.mockResolvedValue({ id: 'eq-1' });
    const result = await controller.remove('eq-1', mockUser);
    expect(result).toBeUndefined();
    expect(mockService.remove).toHaveBeenCalledWith('eq-1', 'org-1');
  });

  it('getLogs should delegate to service', async () => {
    mockService.getLogs.mockResolvedValue([{ id: 'log-1' }]);
    const result = await controller.getLogs('eq-1', mockUser);
    expect(result).toEqual([{ id: 'log-1' }]);
  });

  it('retire should delegate to service', async () => {
    const dto = { reason: 'Equipo roto durante evento', eventId: 'evt-1' };
    mockService.retire.mockResolvedValue({ id: 'eq-1', availabilityStatus: 'retired' });
    const result = await controller.retire('eq-1', dto, mockUser);
    expect(result.availabilityStatus).toBe('retired');
  });
});
