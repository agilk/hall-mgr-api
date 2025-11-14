import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentVisibility } from '../../../entities/document.entity';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Document title',
    example: 'Exam Guidelines 2025',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Updated guidelines for exam supervision',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.INSTRUCTION,
  })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiPropertyOptional({
    description: 'Document visibility',
    enum: DocumentVisibility,
    example: DocumentVisibility.PRIVATE,
  })
  @IsEnum(DocumentVisibility)
  @IsOptional()
  visibility?: DocumentVisibility;

  @ApiPropertyOptional({
    description: 'Document category',
    example: 'guidelines',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Document tags',
    type: [String],
    example: ['guidelines', 'supervision', '2025'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Related exam ID',
    example: 'EXM-001',
  })
  @IsString()
  @IsOptional()
  examId?: string;

  @ApiPropertyOptional({
    description: 'Related building ID',
    example: 1,
  })
  @IsOptional()
  buildingId?: number;

  @ApiPropertyOptional({
    description: 'Related assignment ID',
    example: 'ASN-001',
  })
  @IsString()
  @IsOptional()
  assignmentId?: string;
}
