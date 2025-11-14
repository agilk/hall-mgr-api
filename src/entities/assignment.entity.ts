import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { Exam } from './exam.entity';
import { Violation } from './violation.entity';

export enum AssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('assignments')
@Index(['supervisorId', 'status']) // Optimize queries by supervisor and status
@Index(['examId', 'roomId'], { unique: true }) // Ensure one assignment per room per exam
@Index(['status', 'createdAt']) // Optimize listing by status and date
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.assignments)
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: User;

  @Column({ name: 'supervisor_id', nullable: true })
  supervisorId: string;

  @ManyToOne(() => Room, (room) => room.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Exam, (exam) => exam.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_id' })
  examId: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({ name: 'no_supervisor_needed', default: false })
  noSupervisorNeeded: boolean;

  @Column({ type: 'text', nullable: true })
  justification: string;

  @Column({ type: 'timestamp', nullable: true, name: 'arrival_time' })
  arrivalTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'exam_start_time' })
  examStartTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'exam_end_time' })
  examEndTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'departure_time' })
  departureTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  payment: number;

  @Column({ type: 'boolean', default: false, name: 'payment_confirmed' })
  paymentConfirmed: boolean;

  @OneToMany(() => Violation, (violation) => violation.assignment, {
    cascade: true,
  })
  violations: Violation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
