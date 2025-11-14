import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ViolationType, ViolationSeverity } from '../../../entities/violation.entity';

export class CreateViolationDto {
  @IsUUID()
  @IsNotEmpty()
  assignmentId: string;

  @IsString()
  @IsOptional()
  participantName?: string;

  @IsString()
  @IsOptional()
  participantId?: string;

  @IsEnum(ViolationType)
  @IsNotEmpty()
  type: ViolationType;

  @IsEnum(ViolationSeverity)
  @IsOptional()
  severity?: ViolationSeverity;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @IsString()
  @IsNotEmpty()
  reportedBy: string;
}
