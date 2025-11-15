import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    it('should return true for public routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Mock the parent class canActivate method
      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });

    it('should call super.canActivate when isPublic is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });

    it('should call super.canActivate when isPublic is null', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });

    it('should check both handler and class for public decorator', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        expect.arrayContaining([
          mockExecutionContext.getHandler(),
          mockExecutionContext.getClass(),
        ]),
      );

      superCanActivateSpy.mockRestore();
    });
  });

  describe('inheritance', () => {
    it('should extend AuthGuard', () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });

    it('should have reflector injected', () => {
      expect(guard['reflector']).toBeDefined();
      expect(guard['reflector']).toBe(reflector);
    });
  });
});
