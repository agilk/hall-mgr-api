import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exam } from './exam.entity';
import { Room } from './room.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity('attendances')
@Index(['examId', 'roomId']) // Optimize queries by exam and room
@Index(['participantName']) // Optimize search by participant name
@Index(['status', 'examId']) // Optimize queries by status and exam
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exam, (exam) => exam.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_id' })
  examId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'participant_name' })
  participantName: string;

  @Column({ name: 'participant_id', nullable: true })
  participantId: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true, name: 'marked_at' })
  markedAt: Date;

  @Column({ name: 'marked_by', nullable: true })
  markedBy: string; // User ID of supervisor

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
