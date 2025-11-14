import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Hall } from './hall.entity';

export enum BuildingSyncStatus {
  SYNCED = 'synced',
  SYNC_PENDING = 'sync_pending',
  SYNC_ERROR = 'sync_error',
}

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === EXTERNAL SYSTEM INTEGRATION ===
  @Column({ unique: true, nullable: true, name: 'external_id' })
  externalId: number;

  @Column({ unique: true, nullable: true, name: 'external_uid' })
  externalUid: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_synced_at',
  })
  lastSyncedAt: Date;

  @Column({
    type: 'enum',
    enum: BuildingSyncStatus,
    default: BuildingSyncStatus.SYNCED,
    name: 'sync_status',
  })
  syncStatus: BuildingSyncStatus;

  @Column({ type: 'text', nullable: true, name: 'sync_error' })
  syncError: string;

  // === CORE FIELDS ===
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'int', nullable: true, name: 'place_limit' })
  placeLimit: number;

  @Column({ type: 'int', nullable: true, name: 'region_id' })
  regionId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => Hall, (hall) => hall.building, { cascade: true })
  halls: Hall[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
