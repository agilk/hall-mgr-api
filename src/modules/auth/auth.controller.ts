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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ValidationPipe } from '../../common/pipes/validation.pipe';

@Controller('api/v1/auth')
@UsePipes(new ValidationPipe())
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
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
  async getProfile(@CurrentUser() user: any) {
    const userData = await this.authService.validateUser(user.id);

    return {
      success: true,
      data: userData,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    // For stateless JWT, logout is handled on the client side
    // In the future, we could implement token blacklisting
    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
