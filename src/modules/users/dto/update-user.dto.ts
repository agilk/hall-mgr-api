import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @IsArray()
  @IsOptional()
  preferredBuildingIds?: string[];

  @IsArray()
  @IsOptional()
  managedBuildingIds?: string[];
}
