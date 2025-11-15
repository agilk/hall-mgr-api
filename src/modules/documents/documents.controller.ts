import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user.entity';
import { multerConfig, MAX_FILE_SIZE } from '../../common/config/multer.config';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({
    summary: 'Upload document with file',
    description: 'Upload a document file along with metadata. Supports PDF, Word, Excel, PowerPoint, images, and archives up to 10MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)',
        },
        title: {
          type: 'string',
          example: 'Exam Guidelines 2025',
        },
        description: {
          type: 'string',
          example: 'Updated guidelines for exam supervision',
        },
        type: {
          type: 'string',
          enum: ['guideline', 'report', 'form', 'certificate', 'photo', 'other'],
          example: 'guideline',
        },
        visibility: {
          type: 'string',
          enum: ['public', 'private', 'restricted'],
          example: 'private',
        },
        category: {
          type: 'string',
          example: 'guidelines',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['guidelines', 'supervision', '2025'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    schema: {
      example: {
        id: 'DOC-001',
        title: 'Exam Guidelines 2025',
        description: 'Updated guidelines for exam supervision',
        fileName: 'exam_guidelines_2025.pdf',
        filePath: '/uploads/2025/1699876543210-abc123def456.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048576,
        fileSizeFormatted: '2 MB',
        category: 'guidelines',
        uploadedBy: 1,
        visibility: 'private',
        createdAt: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size exceeds 10MB' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.uploadDocument(file, uploadDocumentDto, user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create document record (without file)',
    description: 'Create metadata record for a document without uploading a file. Use /upload endpoint for file uploads.',
  })
  @ApiResponse({
    status: 201,
    description: 'Document record created successfully',
    schema: {
      example: {
        id: 'DOC-001',
        title: 'External Document Reference',
        description: 'Link to external document',
        category: 'references',
        uploadedBy: 1,
        createdAt: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createDocumentDto: CreateDocumentDto, @CurrentUser() user: any) {
    return this.documentsService.create(createDocumentDto, user?.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all documents',
    description: 'Retrieve a list of all document records with metadata. Supports filtering by type, category, and exam.',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by document type', enum: ['guideline', 'report', 'form', 'certificate', 'photo', 'other'] })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'examId', required: false, description: 'Filter by exam ID' })
  @ApiQuery({ name: 'buildingId', required: false, description: 'Filter by building ID' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    schema: {
      example: [
        {
          id: 'DOC-001',
          title: 'Exam Guidelines 2025',
          description: 'Updated guidelines for exam supervision',
          fileName: 'exam_guidelines_2025.pdf',
          mimeType: 'application/pdf',
          fileSize: 2048576,
          fileSizeFormatted: '2 MB',
          category: 'guidelines',
          uploadedBy: 1,
          uploaderName: 'Jane Manager',
          visibility: 'private',
          downloadCount: 15,
          createdAt: '2025-11-14T10:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('examId') examId?: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.documentsService.findAll({ type, category, examId, buildingId });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieve detailed information about a specific document including uploader details.',
  })
  @ApiParam({ name: 'id', description: 'Document ID', example: 'DOC-001' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    schema: {
      example: {
        id: 'DOC-001',
        title: 'Exam Guidelines 2025',
        description: 'Updated guidelines for exam supervision',
        file_name: 'exam_guidelines_2025.pdf',
        file_path: '/documents/2025/exam_guidelines_2025.pdf',
        file_type: 'application/pdf',
        file_size: 2048576,
        category: 'guidelines',
        uploaded_by: 1,
        uploader: {
          id: 1,
          full_name: 'Jane Manager',
          email: 'jane@example.com',
        },
        is_public: false,
        tags: ['guidelines', 'supervision', '2025'],
        download_count: 15,
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update document record',
    description: 'Update document metadata. Only EXAM_DIRECTOR or BUILDING_MANAGER can update documents.',
  })
  @ApiParam({ name: 'id', description: 'Document ID', example: 'DOC-001' })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    schema: {
      example: {
        id: 'DOC-001',
        title: 'Updated: Exam Guidelines 2025',
        description: 'Updated description',
        category: 'guidelines',
        updated_at: '2025-11-14T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download document file',
    description: 'Download the actual file associated with a document. Increments download counter.',
  })
  @ApiParam({ name: 'id', description: 'Document ID', example: 'DOC-001' })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document or file not found' })
  async downloadDocument(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const document = await this.documentsService.incrementDownloadCount(id);

    if (!document.filePath) {
      throw new NotFoundException('File not found for this document');
    }

    const file = createReadStream(join(process.cwd(), document.filePath));

    res.set({
      'Content-Type': document.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.originalName}"`,
    });

    return new StreamableFile(file);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete a document record and associated file. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Document ID', example: 'DOC-001' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}

// Add import at the top if not already present
import { NotFoundException } from '@nestjs/common';
