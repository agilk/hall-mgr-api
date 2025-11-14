import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  ASSIGNMENT_OFFER = 'assignment_offer',
  ASSIGNMENT_ACCEPTED = 'assignment_accepted',
  ASSIGNMENT_REJECTED = 'assignment_rejected',
  ASSIGNMENT_CANCELLED = 'assignment_cancelled',
  ROOM_UNASSIGNED_ALERT = 'room_unassigned_alert',
  VIOLATION_REPORTED = 'violation_reported',
  FEEDBACK_RECEIVED = 'feedback_received',
  PAYMENT_RECORDED = 'payment_recorded',
  EXAM_REMINDER = 'exam_reminder',
  SYSTEM_MESSAGE = 'system_message',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional context (e.g., assignmentId, roomId)

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'boolean', default: false, name: 'email_sent' })
  emailSent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
