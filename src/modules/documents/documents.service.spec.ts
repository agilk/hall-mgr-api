import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import {
  Document,
  DocumentType,
  DocumentVisibility,
} from '../../entities/document.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repository: MockType<Repository<Document>>;
  let logger: any;

  const mockDocument: Partial<Document> = {
    id: 'document-uuid-1',
    name: 'exam-instructions.pdf',
    originalName: 'Exam Instructions 2024.pdf',
    description: 'Instructions for final exam',
    type: DocumentType.INSTRUCTION,
    visibility: DocumentVisibility.SUPERVISORS,
    filePath: '/uploads/documents/exam-instructions.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    uploadedBy: 'user-uuid-1',
    examId: 'exam-uuid-1',
    buildingId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    repository = module.get(getRepositoryToken(Document));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDocumentDto = {
      name: 'exam-instructions.pdf',
      originalName: 'Exam Instructions 2024.pdf',
      description: 'Instructions for final exam',
      type: DocumentType.INSTRUCTION,
      visibility: DocumentVisibility.SUPERVISORS,
      filePath: '/uploads/documents/exam-instructions.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      uploadedBy: 'user-uuid-1',
      examId: 'exam-uuid-1',
    };

    it('should create document successfully', async () => {
      repository.create.mockReturnValue(mockDocument as Document);
      repository.save.mockResolvedValue(mockDocument as Document);

      const result = await service.create(createDocumentDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDocumentDto,
          type: DocumentType.INSTRUCTION,
          visibility: DocumentVisibility.SUPERVISORS,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it('should default to OTHER type if not provided', async () => {
      const dtoWithoutType = {
        name: 'misc-file.pdf',
        originalName: 'Miscellaneous File.pdf',
        filePath: '/uploads/documents/misc.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        uploadedBy: 'user-uuid-1',
      };

      const documentWithDefaultType = {
        ...mockDocument,
        type: DocumentType.OTHER,
      };

      repository.create.mockReturnValue(documentWithDefaultType as Document);
      repository.save.mockResolvedValue(documentWithDefaultType as Document);

      const result = await service.create(dtoWithoutType);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DocumentType.OTHER,
        }),
      );
      expect(result.type).toBe(DocumentType.OTHER);
    });

    it('should default to PRIVATE visibility if not provided', async () => {
      const dtoWithoutVisibility = {
        name: 'private-file.pdf',
        originalName: 'Private File.pdf',
        filePath: '/uploads/documents/private.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        uploadedBy: 'user-uuid-1',
      };

      const documentWithDefaultVisibility = {
        ...mockDocument,
        visibility: DocumentVisibility.PRIVATE,
      };

      repository.create.mockReturnValue(documentWithDefaultVisibility as Document);
      repository.save.mockResolvedValue(documentWithDefaultVisibility as Document);

      const result = await service.create(dtoWithoutVisibility);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: DocumentVisibility.PRIVATE,
        }),
      );
      expect(result.visibility).toBe(DocumentVisibility.PRIVATE);
    });

    it('should create document without optional fields', async () => {
      const minimalDto = {
        name: 'simple-file.pdf',
        originalName: 'Simple File.pdf',
        filePath: '/uploads/documents/simple.pdf',
        fileSize: 100000,
        mimeType: 'application/pdf',
        uploadedBy: 'user-uuid-1',
      };

      const minimalDocument = {
        ...mockDocument,
        description: undefined,
        examId: undefined,
        buildingId: undefined,
      };

      repository.create.mockReturnValue(minimalDocument as Document);
      repository.save.mockResolvedValue(minimalDocument as Document);

      const result = await service.create(minimalDto);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const documents = [
        mockDocument,
        { ...mockDocument, id: 'document-uuid-2' },
      ];
      repository.find.mockResolvedValue(documents);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(documents);
    });
  });

  describe('findOne', () => {
    it('should return document by id', async () => {
      repository.findOne.mockResolvedValue(mockDocument);

      const result = await service.findOne('document-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'document-uuid-1' },
      });
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDocumentDto = {
      description: 'Updated description',
      visibility: DocumentVisibility.PUBLIC,
    };

    it('should update document successfully', async () => {
      const updatedDocument = {
        ...mockDocument,
        description: 'Updated description',
        visibility: DocumentVisibility.PUBLIC,
      };

      repository.findOne.mockResolvedValue(mockDocument);
      repository.save.mockResolvedValue(updatedDocument as Document);

      const result = await service.update('document-uuid-1', updateDocumentDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
      expect(result.visibility).toBe(DocumentVisibility.PUBLIC);
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDocumentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove document', async () => {
      repository.findOne.mockResolvedValue(mockDocument);
      repository.remove.mockResolvedValue(mockDocument);

      await service.remove('document-uuid-1');

      expect(repository.remove).toHaveBeenCalledWith(mockDocument);
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
