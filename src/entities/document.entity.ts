import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocumentType {
  PROFILE_PHOTO = 'profile_photo',
  INSTRUCTION = 'instruction',
  SAMPLE_ANSWER_SHEET = 'sample_answer_sheet',
  EXAM_MATERIAL = 'exam_material',
  OTHER = 'other',
}

export enum DocumentVisibility {
  PUBLIC = 'public',
  SUPERVISORS = 'supervisors',
  BUILDING_MANAGERS = 'building_managers',
  EXAM_DIRECTORS = 'exam_directors',
  PRIVATE = 'private',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentVisibility,
    default: DocumentVisibility.PRIVATE,
  })
  visibility: DocumentVisibility;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size' })
  fileSize: number; // in bytes

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string; // User ID

  @Column({ name: 'exam_id', nullable: true })
  examId: string;

  @Column({ name: 'building_id', nullable: true })
  buildingId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
