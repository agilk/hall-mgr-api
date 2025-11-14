import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    public jwtService: JwtService, // Public for controller access
    private logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  async register(registerDto: RegisterDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: registerDto.username },
        { email: registerDto.email },
        { phone: registerDto.phone },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create new user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      isActive: false, // Needs activation
      isApproved: false, // Needs approval for supervisors
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;

    this.logger.log(`New user registered: ${savedUser.username}`);
    return savedUser;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is not active');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.mfaEnabled) {
      // Return temporary token for 2FA verification
      const tempToken = this.jwtService.sign(
        { sub: user.id, temp: true },
        { expiresIn: '5m' },
      );

      return {
        requiresMfa: true,
        tempToken,
      };
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in: ${user.username}`);
    return tokens;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async setup2FA(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Exam Supervision (${user.username})`,
      issuer: 'Exam Management System',
    });

    // Store secret temporarily (will be confirmed after verification)
    user.mfaSecret = secret.base32;
    await this.userRepository.save(user);

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async verify2FA(userId: number, otp: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('2FA not set up');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otp,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Enable 2FA if not already enabled
    if (!user.mfaEnabled) {
      user.mfaEnabled = true;
      await this.userRepository.save(user);
      this.logger.log(`2FA enabled for user: ${user.username}`);
    }

    // Generate tokens
    return await this.generateTokens(user);
  }

  async disable2FA(userId: number, otp: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify OTP before disabling
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otp,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await this.userRepository.save(user);

    this.logger.log(`2FA disabled for user: ${user.username}`);
    return { message: '2FA disabled successfully' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
      externalUserId: user.externalUserId,
    };

    const accessTokenLifetime = process.env.ACCESS_TOKEN_LIFETIME || '30m';
    const refreshTokenLifetime = process.env.REFRESH_TOKEN_LIFETIME || '240h';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenLifetime as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: refreshTokenLifetime as any },
    );

    return {
      accessToken,
      refreshToken,
      accessExpires: accessTokenLifetime,
      refreshExpires: refreshTokenLifetime,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    delete user.password;
    delete user.mfaSecret;

    return user;
  }
}
