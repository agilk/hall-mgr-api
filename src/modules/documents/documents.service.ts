import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType, DocumentVisibility } from '../../entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('DocumentsService');
  }

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create({
      ...createDocumentDto,
      type: createDocumentDto.type || DocumentType.OTHER,
      visibility: createDocumentDto.visibility || DocumentVisibility.PRIVATE,
    });
    const saved = await this.documentRepository.save(document);
    this.logger.log(`Document created: ${saved.id}`);
    return saved;
  }

  async findAll() {
    return this.documentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDocumentDto);
    return this.documentRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    await this.documentRepository.remove(document);
    this.logger.log(`Document deleted: ${id}`);
  }
}
