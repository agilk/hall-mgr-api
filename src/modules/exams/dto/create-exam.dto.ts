import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { ExamStatus } from '../../../entities/exam.entity';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  examDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsEnum(ExamStatus)
  @IsOptional()
  status?: ExamStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  totalParticipants?: number;
}
