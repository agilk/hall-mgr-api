import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsOptional()
  personalId?: string;

  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @IsString()
  @IsOptional()
  institution?: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  contactDetails?: string;

  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}
