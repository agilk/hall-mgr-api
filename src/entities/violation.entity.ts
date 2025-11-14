import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Assignment } from './assignment.entity';

export enum ViolationType {
  CHEATING = 'cheating',
  PROHIBITED_MATERIAL = 'prohibited_material',
  LATE_ARRIVAL = 'late_arrival',
  EARLY_DEPARTURE = 'early_departure',
  DISRUPTION = 'disruption',
  PHONE_USE = 'phone_use',
  COMMUNICATION = 'communication',
  OTHER = 'other',
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('violations')
export class Violation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Assignment, (assignment) => assignment.violations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ name: 'participant_name', nullable: true })
  participantName: string;

  @Column({ name: 'participant_id', nullable: true })
  participantId: string;

  @Column({
    type: 'enum',
    enum: ViolationType,
  })
  type: ViolationType;

  @Column({
    type: 'enum',
    enum: ViolationSeverity,
    default: ViolationSeverity.MEDIUM,
  })
  severity: ViolationSeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp', name: 'occurred_at' })
  occurredAt: Date;

  @Column({ name: 'reported_by' })
  reportedBy: string; // User ID of supervisor

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
