import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockService = {
    register: jest.fn(),
    login: jest.fn(),
    pinLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register should delegate to service', async () => {
    const dto = {
      organizationName: 'Demo',
      slug: 'demo',
      name: 'Admin',
      email: 'admin@test.com',
      password: '12345678',
    };
    mockService.register.mockResolvedValue({ token: 'tok', user: { id: 'user-1' } });
    const result = await controller.register(dto);
    expect(result).toEqual({ token: 'tok', user: { id: 'user-1' } });
    expect(mockService.register).toHaveBeenCalledWith(dto);
  });

  it('login should delegate to service', async () => {
    mockService.login.mockResolvedValue({ token: 'tok', user: { id: 'user-1' } });
    const result = await controller.login({ email: 'admin@test.com', password: '12345678' });
    expect(result).toEqual({ token: 'tok', user: { id: 'user-1' } });
    expect(mockService.login).toHaveBeenCalledWith('admin@test.com', '12345678');
  });

  it('pinLogin should delegate to service', async () => {
    mockService.pinLogin.mockResolvedValue({ token: 'tok', user: { id: 'user-2' } });
    const result = await controller.pinLogin({ pin: '1234' });
    expect(result).toEqual({ token: 'tok', user: { id: 'user-2' } });
    expect(mockService.pinLogin).toHaveBeenCalledWith('1234');
  });
});
