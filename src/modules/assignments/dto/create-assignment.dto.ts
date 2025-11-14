import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { AssignmentStatus } from '../../../entities/assignment.entity';

export class CreateAssignmentDto {
  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  examId: string;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @IsBoolean()
  @IsOptional()
  noSupervisorNeeded?: boolean;

  @IsString()
  @IsOptional()
  justification?: string;

  @IsNumber()
  @IsOptional()
  payment?: number;
}
