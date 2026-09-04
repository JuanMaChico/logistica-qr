import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContext = (role?: string) => ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { role } : undefined,
      }),
    }),
  }) as ExecutionContext;

  it('should allow access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(mockContext('owner'))).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner']);

    expect(guard.canActivate(mockContext('owner'))).toBe(true);
  });

  it('should throw ForbiddenException when user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner']);

    expect(() => guard.canActivate(mockContext('technician'))).toThrow(ForbiddenException);
  });

  it('should throw when user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner']);

    expect(() => guard.canActivate(mockContext())).toThrow();
  });
});
