import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createMockExecutionContext = (user?: any): ExecutionContext => {
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user }),
        }),
      } as unknown as ExecutionContext;
    };

    it('should return true when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ id: 1, roles: [] });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return true when required roles array is empty', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockExecutionContext({ id: 1, roles: [] });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['supervisor']);
      const context = createMockExecutionContext({
        id: 1,
        roles: ['supervisor', 'manager'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['director', 'manager']);
      const context = createMockExecutionContext({
        id: 1,
        roles: ['supervisor', 'manager'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['director']);
      const context = createMockExecutionContext({
        id: 1,
        roles: ['supervisor', 'manager'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user has no roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['supervisor']);
      const context = createMockExecutionContext({ id: 1, roles: [] });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user roles is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['supervisor']);
      const context = createMockExecutionContext({ id: 1 });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['supervisor']);
      const context = createMockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user is null', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['supervisor']);
      const context = createMockExecutionContext(null);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should check both handler and class for roles decorator', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['supervisor']);
      const context = createMockExecutionContext({ id: 1, roles: ['supervisor'] });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        expect.arrayContaining([context.getHandler(), context.getClass()]),
      );
    });

    it('should handle case-sensitive role matching', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Supervisor']);
      const context = createMockExecutionContext({
        id: 1,
        roles: ['supervisor'],
      });

      const result = guard.canActivate(context);

      // Should be false because role matching is case-sensitive
      expect(result).toBe(false);
    });

    it('should return true when user has multiple roles and one matches', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['director']);
      const context = createMockExecutionContext({
        id: 1,
        roles: ['supervisor', 'manager', 'director', 'admin'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user roles is empty array and roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['supervisor']);
      const context = createMockExecutionContext({
        id: 1,
        roles: [],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should have reflector injected', () => {
      expect(guard['reflector']).toBeDefined();
      expect(guard['reflector']).toBe(reflector);
    });
  });
});
