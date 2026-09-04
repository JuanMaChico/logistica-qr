import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;

  const mockService = {
    getCount: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'owner' as const, phone: null, orgId: 'org-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockService }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getCount should delegate to service', async () => {
    mockService.getCount.mockResolvedValue({ count: 2 });
    const result = await controller.getCount('in_progress', mockUser);
    expect(result).toEqual({ count: 2 });
    expect(mockService.getCount).toHaveBeenCalledWith('org-1', 'user-1', 'owner', 'in_progress');
  });

  it('findAll should delegate to service', async () => {
    mockService.findAll.mockResolvedValue([{ id: 'evt-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'evt-1' }]);
    expect(mockService.findAll).toHaveBeenCalledWith('user-1', 'owner', 'org-1');
  });

  it('findOne should delegate to service', async () => {
    mockService.findOne.mockResolvedValue({ id: 'evt-1' });
    const result = await controller.findOne('evt-1');
    expect(result).toEqual({ id: 'evt-1' });
    expect(mockService.findOne).toHaveBeenCalledWith('evt-1');
  });

  it('create should delegate to service', async () => {
    const dto = {
      name: 'Boda',
      type: 'party' as const,
      clientName: 'Cliente',
      departureDate: '2026-08-10T10:00:00.000Z',
      returnDate: '2026-08-11T10:00:00.000Z',
    };
    mockService.create.mockResolvedValue({ id: 'evt-1', ...dto });
    const result = await controller.create(dto, mockUser);
    expect(result).toMatchObject({ id: 'evt-1' });
    expect(mockService.create).toHaveBeenCalledWith(dto, 'user-1', 'org-1');
  });

  it('update should delegate to service', async () => {
    mockService.update.mockResolvedValue({ id: 'evt-1', name: 'Updated' });
    const result = await controller.update('evt-1', { name: 'Updated' }, mockUser);
    expect(result.name).toBe('Updated');
    expect(mockService.update).toHaveBeenCalledWith('evt-1', { name: 'Updated' }, 'org-1');
  });

  it('remove should delegate to service', async () => {
    mockService.remove.mockResolvedValue(undefined);
    const result = await controller.remove('evt-1', mockUser);
    expect(result).toBeUndefined();
    expect(mockService.remove).toHaveBeenCalledWith('evt-1', 'org-1');
  });
});
