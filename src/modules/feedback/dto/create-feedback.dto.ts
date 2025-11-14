import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { FeedbackType } from '../../../entities/feedback.entity';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsOptional()
  recipientId?: string;

  @IsUUID()
  @IsOptional()
  assignmentId?: string;

  @IsEnum(FeedbackType)
  @IsNotEmpty()
  type: FeedbackType;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;
}
