import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

jest.mock('bcrypt');
jest.mock('speakeasy');
jest.mock('qrcode');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: MockType<Repository<User>>;
  let jwtService: JwtService;
  let logger: any;

  const mockUser: Partial<User> = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phone: '+1234567890',
    fullName: 'Test User',
    password: 'hashedPassword',
    roles: ['supervisor'],
    isActive: true,
    isApproved: true,
    mfaEnabled: false,
    mfaSecret: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      phone: '+9876543210',
      fullName: 'New User',
      password: 'password123',
      roles: ['supervisor'],
    };

    it('should register a new user successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...registerDto,
          password: 'hashedPassword',
          isActive: false,
          isApproved: false,
        }),
      );
      expect(result.password).toBeUndefined();
    });

    it('should throw BadRequestException if user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should login successfully without 2FA', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.requiresMfa).toBeUndefined();
    });

    it('should require 2FA if enabled', async () => {
      const userWith2FA = { ...mockUser, mfaEnabled: true };
      userRepository.findOne.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('temp-token');

      const result = await service.login(loginDto);

      expect(result.requiresMfa).toBe(true);
      expect(result.tempToken).toBe('temp-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const payload = { sub: 1 };
      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      userRepository.findOne.mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: 999 };
      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const payload = { sub: 1 };
      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('setup2FA', () => {
    it('should setup 2FA successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'SECRET123',
      });

      const mockSecret = {
        base32: 'SECRET123',
        otpauth_url: 'otpauth://totp/ExamSupervision',
      };

      (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
      (qrcode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64...');

      const result = await service.setup2FA(1);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result.secret).toBe('SECRET123');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.setup2FA(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if 2FA already enabled', async () => {
      const userWith2FA = { ...mockUser, mfaEnabled: true };
      userRepository.findOne.mockResolvedValue(userWith2FA);

      await expect(service.setup2FA(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verify2FA', () => {
    it('should verify 2FA and enable it for first time', async () => {
      const userWithSecret = { ...mockUser, mfaSecret: 'SECRET123' };
      userRepository.findOne.mockResolvedValue(userWithSecret);
      userRepository.save.mockResolvedValue({
        ...userWithSecret,
        mfaEnabled: true,
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.verify2FA(1, '123456');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should verify 2FA for already enabled user', async () => {
      const userWith2FA = {
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'SECRET123',
      };
      userRepository.findOne.mockResolvedValue(userWith2FA);

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.verify2FA(1, '123456');

      expect(result).toHaveProperty('accessToken');
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if OTP is invalid', async () => {
      const userWithSecret = { ...mockUser, mfaSecret: 'SECRET123' };
      userRepository.findOne.mockResolvedValue(userWithSecret);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.verify2FA(1, 'wrong-otp')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if 2FA not set up', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.verify2FA(1, '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA successfully', async () => {
      const userWith2FA = {
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'SECRET123',
      };
      userRepository.findOne.mockResolvedValue(userWith2FA);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        mfaEnabled: false,
        mfaSecret: null,
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await service.disable2FA(1, '123456');

      expect(result).toHaveProperty('message');
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          mfaEnabled: false,
          mfaSecret: null,
        }),
      );
    });

    it('should throw BadRequestException if 2FA not enabled', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.disable2FA(1, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if OTP is invalid', async () => {
      const userWith2FA = {
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'SECRET123',
      };
      userRepository.findOne.mockResolvedValue(userWith2FA);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.disable2FA(1, 'wrong-otp')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should validate and return user', async () => {
      const userWithSensitiveData = {
        ...mockUser,
        password: 'hashedPassword',
        mfaSecret: 'SECRET123',
      };
      userRepository.findOne.mockResolvedValue(userWithSensitiveData);

      const result = await service.validateUser(1);

      expect(result.password).toBeUndefined();
      expect(result.mfaSecret).toBeUndefined();
      expect(result.username).toBe('testuser');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.validateUser(1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
