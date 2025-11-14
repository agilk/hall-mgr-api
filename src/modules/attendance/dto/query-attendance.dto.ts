import { IsOptional, IsUUID, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../../entities/attendance.entity';

export class QueryAttendanceDto {
  @IsOptional()
  @IsUUID()
  examId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  participantName?: string;

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
