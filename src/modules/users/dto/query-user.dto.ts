import { IsOptional, IsString, IsBoolean, IsArray, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryUserDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  roles?: string[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
