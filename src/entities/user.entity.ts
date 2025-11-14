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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'external_auth_id', unique: true })
  externalAuthId: string; // ID from external auth service

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'father_name', nullable: true })
  fatherName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'profile_photo_url', nullable: true })
  profilePhotoUrl: string;

  @Column({ nullable: true })
  institution: string;

  @Column({ nullable: true })
  specialty: string;

  @Column({ name: 'contact_details', nullable: true })
  contactDetails: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.SUPERVISOR],
  })
  roles: UserRole[];

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_APPROVAL,
  })
  status: UserStatus;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', nullable: true })
  twoFactorSecret: string;

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
