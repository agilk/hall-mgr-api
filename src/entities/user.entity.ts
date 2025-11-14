import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { Building } from './building.entity';
import { Feedback } from './feedback.entity';
import { Notification } from './notification.entity';

export enum UserRole {
  SUPERVISOR = 'supervisor',
  VOLUNTEER = 'volunteer',
  BUILDING_MANAGER = 'building_manager',
  EXAM_DIRECTOR = 'exam_director',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_APPROVAL = 'pending_approval',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uid: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false }) // Don't select password by default
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ name: 'external_auth_id', unique: true, nullable: true })
  externalAuthId: string; // ID from external auth service

  @Column({ name: 'external_user_id', nullable: true })
  externalUserId: string; // User ID from external auth service

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'middle_name', nullable: true })
  middleName: string;

  @Column({ name: 'personal_id', nullable: true })
  personalId: string;

  @Column({ name: 'gender', nullable: true })
  gender: string;

  @Column({ type: 'date', nullable: true })
  birthday: Date;

  @Column({ name: 'profile_photo_url', nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  institution: string;

  @Column({ nullable: true })
  specialty: string;

  @Column({ name: 'contact_details', nullable: true })
  contactDetails: string;

  @Column({
    type: 'simple-array',
    default: 'supervisor',
  })
  roles: string[];

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', nullable: true, select: false })
  mfaSecret: string;

  @ManyToMany(() => Building)
  @JoinTable({
    name: 'user_preferred_buildings',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'building_id' },
  })
  preferredBuildings: Building[];

  @ManyToMany(() => Building)
  @JoinTable({
    name: 'user_managed_buildings',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'building_id' },
  })
  managedBuildings: Building[];

  @OneToMany(() => Assignment, (assignment) => assignment.supervisor)
  assignments: Assignment[];

  @OneToMany(() => Feedback, (feedback) => feedback.author)
  feedbackGiven: Feedback[];

  @OneToMany(() => Feedback, (feedback) => feedback.recipient)
  feedbackReceived: Feedback[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
