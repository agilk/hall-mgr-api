import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PROFILE_UPDATE = 'profile_update',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  USER_APPROVED = 'user_approved',
  USER_DEACTIVATED = 'user_deactivated',
  ASSIGNMENT_CREATED = 'assignment_created',
  ASSIGNMENT_UPDATED = 'assignment_updated',
  ASSIGNMENT_DELETED = 'assignment_deleted',
  ASSIGNMENT_ACCEPTED = 'assignment_accepted',
  ASSIGNMENT_REJECTED = 'assignment_rejected',
  ROOM_MARKED_NO_SUPERVISOR = 'room_marked_no_supervisor',
  ATTENDANCE_MARKED = 'attendance_marked',
  VIOLATION_REPORTED = 'violation_reported',
  FEEDBACK_SUBMITTED = 'feedback_submitted',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_DELETED = 'document_deleted',
  PAYMENT_RECORDED = 'payment_recorded',
  BUILDING_CREATED = 'building_created',
  BUILDING_UPDATED = 'building_updated',
  BUILDING_DELETED = 'building_deleted',
  EXAM_CREATED = 'exam_created',
  EXAM_UPDATED = 'exam_updated',
  EXAM_DELETED = 'exam_deleted',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index()
  action: AuditAction;

  @Column({ name: 'entity_type', nullable: true })
  entityType: string; // e.g., 'Assignment', 'User', 'Building'

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'old_value' })
  oldValue: any;

  @Column({ type: 'jsonb', nullable: true, name: 'new_value' })
  newValue: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
