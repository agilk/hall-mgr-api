import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsInt, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsUUID()
  @IsNotEmpty()
  hallId: string;

  @IsUUID()
  @IsOptional()
  buildingId?: string;
}
