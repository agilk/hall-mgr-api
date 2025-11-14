import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './create-assignment.dto';
import { IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
  @IsDateString()
  @IsOptional()
  arrivalTime?: string;

  @IsDateString()
  @IsOptional()
  examStartTime?: string;

  @IsDateString()
  @IsOptional()
  examEndTime?: string;

  @IsDateString()
  @IsOptional()
  departureTime?: string;

  @IsBoolean()
  @IsOptional()
  paymentConfirmed?: boolean;
}
