import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { Document, DocumentType, DocumentVisibility } from '../../entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { LoggerService } from '../../common/services/logger.service';
import { formatFileSize } from '../../common/config/multer.config';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('DocumentsService');
  }

  async uploadDocument(
    file: Express.Multer.File,
    uploadDocumentDto: UploadDocumentDto,
    userId: number,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const document = this.documentRepository.create({
      name: uploadDocumentDto.title,
      originalName: file.originalname,
      description: uploadDocumentDto.description,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      type: uploadDocumentDto.type || DocumentType.OTHER,
      visibility: uploadDocumentDto.visibility || DocumentVisibility.PRIVATE,
      examId: uploadDocumentDto.examId,
      buildingId: uploadDocumentDto.buildingId?.toString(),
      uploadedBy: userId.toString(),
    });

    const saved = await this.documentRepository.save(document);
    this.logger.log(`Document uploaded: ${saved.id} (${formatFileSize(file.size)})`);

    return saved;
  }

  async create(createDocumentDto: CreateDocumentDto, userId?: number): Promise<Document> {
    const document = this.documentRepository.create({
      ...createDocumentDto,
      type: createDocumentDto.type || DocumentType.OTHER,
      visibility: createDocumentDto.visibility || DocumentVisibility.PRIVATE,
      uploadedBy: userId?.toString(),
    });
    const saved = await this.documentRepository.save(document);
    this.logger.log(`Document created: ${saved.id}`);
    return saved;
  }

  async findAll(filters?: {
    type?: string;
    category?: string;
    examId?: string;
    buildingId?: string;
  }) {
    const query = this.documentRepository.createQueryBuilder('document');

    if (filters?.type) {
      query.andWhere('document.type = :type', { type: filters.type });
    }

    if (filters?.category) {
      query.andWhere('document.category = :category', { category: filters.category });
    }

    if (filters?.examId) {
      query.andWhere('document.examId = :examId', { examId: filters.examId });
    }

    if (filters?.buildingId) {
      query.andWhere('document.buildingId = :buildingId', { buildingId: filters.buildingId });
    }

    query.orderBy('document.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async incrementDownloadCount(id: string): Promise<Document> {
    const document = await this.findOne(id);

    // Downloading is logged but not counted in the current schema
    this.logger.log(`Document downloaded: ${id}`);

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDocumentDto);
    return this.documentRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);

    // Delete physical file if exists
    if (document.filePath && existsSync(document.filePath)) {
      try {
        await unlink(document.filePath);
        this.logger.log(`File deleted: ${document.filePath}`);
      } catch (error) {
        this.logger.error(`Failed to delete file: ${document.filePath}`, error.stack);
      }
    }

    await this.documentRepository.remove(document);
    this.logger.log(`Document deleted: ${id}`);
  }
}
