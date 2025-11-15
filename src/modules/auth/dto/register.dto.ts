import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for login',
    example: 'john.doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Middle name',
    example: 'Michael',
  })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Personal ID or national ID number',
    example: '1234567890123',
  })
  @IsString()
  @IsOptional()
  personalId?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['male', 'female', 'other'],
    example: 'male',
  })
  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15',
  })
  @IsDateString()
  @IsOptional()
  birthday?: string;

  @ApiPropertyOptional({
    description: 'Referral ID',
    example: 'REF123456',
  })
  @IsString()
  @IsOptional()
  referralId?: string;

  @ApiPropertyOptional({
    description: 'Opt out of SMS notifications',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  noSms?: boolean;
}
