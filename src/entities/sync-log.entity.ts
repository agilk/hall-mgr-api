import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SyncType {
  EXAM_HALLS = 'exam_halls',
  HALL_ROOMS = 'hall_rooms',
  PARTICIPANTS = 'participants',
}

export enum SyncStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SyncType,
  })
  syncType: SyncType;

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.IN_PROGRESS,
  })
  status: SyncStatus;

  @Column({ type: 'int', default: 0, name: 'records_processed' })
  recordsProcessed: number;

  @Column({ type: 'int', default: 0, name: 'records_created' })
  recordsCreated: number;

  @Column({ type: 'int', default: 0, name: 'records_updated' })
  recordsUpdated: number;

  @Column({ type: 'int', default: 0, name: 'records_deleted' })
  recordsDeleted: number;

  @Column({ type: 'int', default: 0, name: 'records_errored' })
  recordsErrored: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true, name: 'error_details' })
  errorDetails: object;

  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
