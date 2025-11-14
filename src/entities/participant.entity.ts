import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Building } from './building.entity';
import { Room } from './room.entity';
import { Exam } from './exam.entity';

export enum ParticipantSyncStatus {
  SYNCED = 'synced',
  SYNC_PENDING = 'sync_pending',
  SYNC_ERROR = 'sync_error',
}

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === EXTERNAL SYSTEM INTEGRATION ===
  @Column({ name: 'external_profile_exam_id', nullable: true })
  externalProfileExamId: number;

  @Column({
    name: 'last_synced_at',
    type: 'timestamp',
    nullable: true,
  })
  lastSyncedAt: Date;

  @Column({
    type: 'enum',
    enum: ParticipantSyncStatus,
    default: ParticipantSyncStatus.SYNCED,
    name: 'sync_status',
  })
  syncStatus: ParticipantSyncStatus;

  @Column({ type: 'text', nullable: true, name: 'sync_error' })
  syncError: string;

  // === EXAM ASSIGNMENT (FROM EXTERNAL) ===
  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column({ name: 'building_id' })
  buildingId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Exam, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_id', nullable: true })
  examId: string;

  @Column({ name: 'place_id', nullable: true })
  placeId: number;

  @Column({ type: 'date', name: 'exam_date' })
  examDate: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  // === PARTICIPANT INFO ===
  @Column({ name: 'participant_name', nullable: true })
  participantName: string;

  @Column({ name: 'participant_id', nullable: true })
  participantId: string;

  @Column({ name: 'exam_title', nullable: true })
  examTitle: string;

  @Column({ name: 'participant_count', type: 'int', default: 0 })
  participantCount: number;

  // === LOCAL ATTENDANCE TRACKING ===
  @Column({ name: 'attendance_marked', default: false })
  attendanceMarked: boolean;

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late', 'excused'],
    nullable: true,
    name: 'attendance_status',
  })
  attendanceStatus: string;

  @Column({ type: 'timestamp', nullable: true, name: 'attendance_marked_at' })
  attendanceMarkedAt: Date;

  @Column({ name: 'attendance_marked_by', nullable: true })
  attendanceMarkedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
