import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Hall } from './hall.entity';
import { Assignment } from './assignment.entity';
import { Building } from './building.entity';

export enum RoomSyncStatus {
  SYNCED = 'synced',
  SYNC_PENDING = 'sync_pending',
  SYNC_ERROR = 'sync_error',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === EXTERNAL SYSTEM INTEGRATION ===
  @Column({ unique: true, nullable: true, name: 'external_id' })
  externalId: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_synced_at',
  })
  lastSyncedAt: Date;

  @Column({
    type: 'enum',
    enum: RoomSyncStatus,
    default: RoomSyncStatus.SYNCED,
    name: 'sync_status',
  })
  syncStatus: RoomSyncStatus;

  @Column({ type: 'text', nullable: true, name: 'sync_error' })
  syncError: string;

  // === CORE FIELDS ===
  @Column()
  number: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  active: boolean;

  // === RELATIONSHIPS ===
  @ManyToOne(() => Building, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column({ name: 'building_id', nullable: true })
  buildingId: string;

  @ManyToOne(() => Hall, (hall) => hall.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hall_id' })
  hall: Hall;

  @Column({ name: 'hall_id' })
  hallId: string;

  @OneToMany(() => Assignment, (assignment) => assignment.room, {
    cascade: true,
  })
  assignments: Assignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
