import { PartialType } from '@nestjs/mapped-types';
import { CreateViolationDto } from './create-violation.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateViolationDto extends PartialType(CreateViolationDto) {
  @IsBoolean()
  @IsOptional()
  resolved?: boolean;

  @IsString()
  @IsOptional()
  resolution?: string;
}
