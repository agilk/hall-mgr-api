import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsUUID } from 'class-validator';
import { DocumentType, DocumentVisibility } from '../../../entities/document.entity';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsEnum(DocumentVisibility)
  @IsOptional()
  visibility?: DocumentVisibility;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsInt()
  @IsNotEmpty()
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  uploadedBy: string;

  @IsUUID()
  @IsOptional()
  examId?: string;

  @IsUUID()
  @IsOptional()
  buildingId?: string;
}
