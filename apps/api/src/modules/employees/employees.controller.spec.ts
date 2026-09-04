import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

describe('EmployeesController', () => {
  let controller: EmployeesController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'owner' as const, phone: null, orgId: 'org-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [{ provide: EmployeesService, useValue: mockService }],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should delegate to service', async () => {
    mockService.findAll.mockResolvedValue([{ id: 'emp-1' }]);
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([{ id: 'emp-1' }]);
    expect(mockService.findAll).toHaveBeenCalledWith('org-1');
  });

  it('findOne should delegate to service', async () => {
    mockService.findOne.mockResolvedValue({ id: 'emp-1' });
    const result = await controller.findOne('emp-1', mockUser);
    expect(result).toEqual({ id: 'emp-1' });
    expect(mockService.findOne).toHaveBeenCalledWith('emp-1', 'org-1');
  });

  it('create should delegate to service', async () => {
    const dto = { name: 'Tecnico Nuevo' };
    mockService.create.mockResolvedValue({ id: 'emp-1', ...dto, pin: '1234' });
    const result = await controller.create(dto, mockUser);
    expect(result).toMatchObject({ id: 'emp-1', pin: '1234' });
    expect(mockService.create).toHaveBeenCalledWith(dto, 'org-1');
  });

  it('update should delegate to service', async () => {
    mockService.update.mockResolvedValue({ id: 'emp-1', name: 'Updated' });
    const result = await controller.update('emp-1', { name: 'Updated' }, mockUser);
    expect(result.name).toBe('Updated');
    expect(mockService.update).toHaveBeenCalledWith('emp-1', { name: 'Updated' }, 'org-1');
  });

  it('remove should delegate to service', async () => {
    mockService.remove.mockResolvedValue(undefined);
    const result = await controller.remove('emp-1', mockUser);
    expect(result).toBeUndefined();
    expect(mockService.remove).toHaveBeenCalledWith('emp-1', 'org-1');
  });
});
