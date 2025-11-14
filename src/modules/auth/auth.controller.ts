import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Headers,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ValidationPipe } from '../../common/pipes/validation.pipe';

@ApiTags('auth')
@Controller('api/v1/auth')
@UsePipes(new ValidationPipe())
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account. Account will be pending until approved by an administrator.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'Registration successful. Please wait for approval.',
        data: {
          id: 1,
          email: 'user@example.com',
          full_name: 'John Doe',
          role: 'supervisor',
          status: 'pending',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'Registration successful. Please wait for approval.',
      data: user,
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password. Returns JWT tokens or 2FA challenge if enabled.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      oneOf: [
        {
          example: {
            success: true,
            message: 'Login successful',
            data: {
              access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                id: 1,
                email: 'user@example.com',
                full_name: 'John Doe',
                role: 'supervisor',
              },
            },
          },
        },
        {
          example: {
            success: true,
            message: '2FA required',
            requiresMfa: true,
            tempToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account not approved or inactive' })
  async login(@Body() loginDto: LoginDto) {
    const result: any = await this.authService.login(loginDto);

    if (result.requiresMfa) {
      return {
        success: true,
        message: '2FA required',
        requiresMfa: true,
        tempToken: result.tempToken,
      };
    }

    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        success: true,
        message: 'Token refreshed',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const tokens = await this.authService.refreshToken(token);

    return {
      success: true,
      message: 'Token refreshed',
      data: tokens,
    };
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Setup 2FA',
    description: 'Initialize two-factor authentication. Returns QR code and secret for authenticator app.',
  })
  @ApiResponse({
    status: 200,
    description: '2FA setup initialized',
    schema: {
      example: {
        success: true,
        message: '2FA setup initialized. Scan QR code with your authenticator app.',
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setup2FA(@CurrentUser() user: any) {
    const result = await this.authService.setup2FA(user.id);

    return {
      success: true,
      message: '2FA setup initialized. Scan QR code with your authenticator app.',
      data: result,
    };
  }

  @Public()
  @Post('2fa/verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verify 2FA code',
    description: 'Verify OTP code during login or 2FA setup. Use temp token from login response.',
  })
  @ApiResponse({
    status: 200,
    description: '2FA verified successfully',
    schema: {
      example: {
        success: true,
        message: '2FA verified successfully',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 1,
            email: 'user@example.com',
            full_name: 'John Doe',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid OTP code' })
  async verify2FA(
    @Body() verify2FADto: Verify2FADto,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    // Extract user ID from temp token
    const token = authHeader.replace('Bearer ', '');
    const payload = await this.authService.jwtService.verify(token);

    const result = await this.authService.verify2FA(
      payload.sub,
      verify2FADto.otp,
    );

    return {
      success: true,
      message: '2FA verified successfully',
      data: result,
    };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disable 2FA',
    description: 'Disable two-factor authentication for your account. Requires valid OTP code.',
  })
  @ApiResponse({
    status: 200,
    description: '2FA disabled successfully',
    schema: {
      example: {
        success: true,
        message: '2FA has been disabled',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid OTP code or unauthorized' })
  async disable2FA(
    @CurrentUser() user: any,
    @Body() verify2FADto: Verify2FADto,
  ) {
    const result = await this.authService.disable2FA(user.id, verify2FADto.otp);

    return {
      success: true,
      message: result.message,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user information.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          email: 'user@example.com',
          full_name: 'John Doe',
          role: 'supervisor',
          status: 'active',
          phone: '+1234567890',
          mfa_enabled: true,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    const userData = await this.authService.validateUser(user.id);

    return {
      success: true,
      data: userData,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout current user. Note: With stateless JWT, logout is primarily client-side.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        success: true,
        message: 'Logout successful',
      },
    },
  })
  async logout() {
    // For stateless JWT, logout is handled on the client side
    // In the future, we could implement token blacklisting
    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
