import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object when payload is valid', async () => {
      const payload: JwtPayload = {
        sub: 1,
        username: 'testuser',
        roles: ['supervisor', 'manager'],
        externalUserId: 'ext-123',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        roles: ['supervisor', 'manager'],
        externalUserId: 'ext-123',
      });
    });

    it('should return user object without externalUserId if not provided', async () => {
      const payload: JwtPayload = {
        sub: 2,
        username: 'anotheruser',
        roles: ['director'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 2,
        username: 'anotheruser',
        roles: ['director'],
        externalUserId: undefined,
      });
    });

    it('should return empty roles array if roles not provided', async () => {
      const payload: JwtPayload = {
        sub: 3,
        username: 'norolesuser',
        roles: [],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 3,
        username: 'norolesuser',
        roles: [],
        externalUserId: undefined,
      });
    });

    it('should handle roles as undefined', async () => {
      const payload = {
        sub: 4,
        username: 'undefinedroles',
      } as JwtPayload;

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 4,
        username: 'undefinedroles',
        roles: [],
        externalUserId: undefined,
      });
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const payload = {
        username: 'nosubuser',
        roles: ['supervisor'],
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token payload');
    });

    it('should throw UnauthorizedException when sub is null', async () => {
      const payload = {
        sub: null as any,
        username: 'nullsubuser',
        roles: ['supervisor'],
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when sub is 0', async () => {
      const payload = {
        sub: 0,
        username: 'zerosubuser',
        roles: ['supervisor'],
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should accept valid sub with multiple roles', async () => {
      const payload: JwtPayload = {
        sub: 5,
        username: 'multiuser',
        roles: ['supervisor', 'manager', 'director'],
        externalUserId: 'ext-multi',
      };

      const result = await strategy.validate(payload);

      expect(result.roles).toHaveLength(3);
      expect(result.roles).toContain('supervisor');
      expect(result.roles).toContain('manager');
      expect(result.roles).toContain('director');
    });
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from config', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use default secret when JWT_SECRET is not set', async () => {
      const mockConfigNoSecret = {
        get: jest.fn(() => null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: mockConfigNoSecret,
          },
        ],
      }).compile();

      const strategyWithDefault = module.get<JwtStrategy>(JwtStrategy);
      expect(strategyWithDefault).toBeDefined();
    });
  });
});
