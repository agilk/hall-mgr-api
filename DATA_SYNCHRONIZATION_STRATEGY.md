# Data Synchronization Strategy
# External Hall Getter Integration

## Overview

The Exam Supervision Management System must synchronize critical data from an external Exam Management System:
- **Exam Halls** (Buildings)
- **Hall Rooms** (Rooms)
- **Exam Participants** (Students assigned to rooms)
- **Exam Schedules**

This document outlines the synchronization architecture, strategy, and implementation.

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Ownership](#data-ownership)
3. [Synchronization Strategy](#synchronization-strategy)
4. [Database Schema Updates](#database-schema-updates)
5. [Synchronization Service](#synchronization-service)
6. [API Integration](#api-integration)
7. [Conflict Resolution](#conflict-resolution)
8. [Error Handling](#error-handling)
9. [Implementation Plan](#implementation-plan)

---

## System Architecture

### Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Exam Management System               │
│                                                                  │
│  - Master data for Exam Halls                                   │
│  - Master data for Hall Rooms                                   │
│  - Master data for Participants                                 │
│  - Exam schedules and dates                                     │
│                                                                  │
│  API: /api/external-app/*                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Sync API (Pull)
                            │ - GET /exam-halls
                            │ - GET /hall-rooms/:hallId
                            │ - GET /room-participants/:examDate
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Exam Supervision System (This System)               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Synchronization Service (NEW)                    │  │
│  │  - Periodic sync from external system                     │  │
│  │  - Data transformation and mapping                        │  │
│  │  - Conflict detection and resolution                      │  │
│  │  - Sync status tracking                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Local Database (PostgreSQL)                      │  │
│  │                                                            │  │
│  │  Synchronized Data (Read-only):                           │  │
│  │  - buildings (exam_halls) [external_id, sync metadata]    │  │
│  │  - rooms (hall_rooms) [external_id, sync metadata]        │  │
│  │  - participants [external_id, sync metadata]              │  │
│  │                                                            │  │
│  │  Local Data (Read-write):                                 │  │
│  │  - users (supervisors, managers)                          │  │
│  │  - assignments                                            │  │
│  │  - attendance                                             │  │
│  │  - violations                                             │  │
│  │  - feedback                                               │  │
│  │  - notifications                                          │  │
│  │  - audit_logs                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Ownership

### External System Owns (Source of Truth)

| Entity | External System | This System | Sync Direction |
|--------|----------------|-------------|----------------|
| Exam Halls (Buildings) | ✅ Master | 📖 Read-only Copy | External → Local |
| Hall Rooms | ✅ Master | 📖 Read-only Copy | External → Local |
| Participants | ✅ Master | 📖 Read-only Copy | External → Local |
| Exam Schedules | ✅ Master | 📖 Read-only Copy | External → Local |
| Exam Dates | ✅ Master | 📖 Read-only Copy | External → Local |

### This System Owns (Source of Truth)

| Entity | External System | This System | Sync Direction |
|--------|----------------|-------------|----------------|
| Supervisors/Volunteers | ❌ N/A | ✅ Master | N/A |
| Building Managers | ❌ N/A | ✅ Master | N/A |
| Exam Directors | ❌ N/A | ✅ Master | N/A |
| Assignments | ❌ N/A | ✅ Master | N/A |
| Attendance Records | ❌ N/A | ✅ Master | N/A |
| Violation Reports | ❌ N/A | ✅ Master | N/A |
| Feedback | ❌ N/A | ✅ Master | N/A |
| Notifications | ❌ N/A | ✅ Master | N/A |
| Audit Logs | ❌ N/A | ✅ Master | N/A |

---

## Synchronization Strategy

### Sync Approach: **Pull-based Periodic Sync**

#### Why Pull-based?
- External system provides read-only API
- No webhooks mentioned in documentation
- Controlled sync timing
- Easier error handling and retry logic

### Sync Frequency

| Data Type | Frequency | Reason |
|-----------|-----------|--------|
| Exam Halls | Once daily at 2 AM | Buildings rarely change |
| Hall Rooms | Once daily at 2 AM | Room configurations stable |
| Participants | Every 30 minutes during exam periods | Participant assignments can change |
| Participants | Every 6 hours off-season | Less frequent updates needed |

### Sync Triggers

1. **Scheduled (Automatic)**
   - Cron job runs at defined intervals
   - Different schedules for different data types

2. **Manual (On-demand)**
   - Admin can trigger sync via API
   - Useful for immediate updates

3. **Event-driven (Future enhancement)**
   - Sync when exam is created
   - Sync before exam starts (1 hour prior)

---

## Database Schema Updates

### Updated Building Model (Exam Hall)

```typescript
// models/building.model.ts
import { Table, Column, Model, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';

@Table({
  tableName: 'buildings',
  timestamps: true,
})
export class Building extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  // === EXTERNAL SYSTEM INTEGRATION ===
  @Column({ unique: true, allowNull: false })
  externalId: number; // ID from external exam hall system

  @Column({ unique: true })
  externalUid: string; // UID from external system

  @Column({ type: DataType.DATE })
  lastSyncedAt: Date; // Last successful sync timestamp

  @Column({ defaultValue: 'synced', type: DataType.ENUM('synced', 'sync_pending', 'sync_error') })
  syncStatus: string;

  @Column({ type: DataType.TEXT })
  syncError: string; // Error message if sync failed

  // === CORE FIELDS (FROM EXTERNAL) ===
  @Column({ allowNull: false })
  name: string;

  @Column
  address: string;

  @Column
  placeLimit: number; // Maximum capacity from external system

  @Column
  regionId: number; // From external system

  // === LOCAL FIELDS ===
  @Column
  code: string; // Optional local code

  @Column({ type: DataType.TEXT })
  description: string;

  @Column({ defaultValue: true })
  isActive: boolean; // From external system (isActive = 1)

  @Column({ type: DataType.DATE })
  deletedAt: Date; // From external system

  // === RELATIONSHIPS ===
  @HasMany(() => Hall)
  halls: Hall[];

  @HasMany(() => Room)
  rooms: Room[]; // Direct relationship for synced rooms

  @BelongsToMany(() => User, () => BuildingManager)
  managers: User[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Updated Room Model (Hall Room)

```typescript
// models/room.model.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';

@Table({
  tableName: 'rooms',
  timestamps: true,
})
export class Room extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  // === EXTERNAL SYSTEM INTEGRATION ===
  @Column({ unique: true, allowNull: false })
  externalId: number; // ID from external hall room system

  @Column({ type: DataType.DATE })
  lastSyncedAt: Date;

  @Column({ defaultValue: 'synced', type: DataType.ENUM('synced', 'sync_pending', 'sync_error') })
  syncStatus: string;

  @Column({ type: DataType.TEXT })
  syncError: string;

  // === RELATIONSHIPS ===
  @ForeignKey(() => Building)
  @Column({ allowNull: false })
  buildingId: number; // Maps to examHallId from external system

  @BelongsTo(() => Building)
  building: Building;

  @ForeignKey(() => Hall)
  @Column
  hallId: number; // Optional: internal hall subdivision (not in external system)

  @BelongsTo(() => Hall)
  hall: Hall;

  // === CORE FIELDS (FROM EXTERNAL) ===
  @Column({ allowNull: false })
  name: string;

  @Column({ allowNull: false })
  capacity: number; // From external system

  // === LOCAL FIELDS ===
  @Column({ type: DataType.TEXT })
  description: string;

  @Column({ defaultValue: true })
  isActive: boolean; // From external system (isActive = 1)

  // === RELATIONSHIPS ===
  @HasMany(() => Assignment)
  assignments: Assignment[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### New Participant Model

```typescript
// models/participant.model.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';

@Table({
  tableName: 'participants',
  timestamps: true,
})
export class Participant extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  // === EXTERNAL SYSTEM INTEGRATION ===
  @Column({ allowNull: false })
  externalProfileExamId: number; // Profile exam ID from external system

  @Column({ type: DataType.DATE })
  lastSyncedAt: Date;

  @Column({ defaultValue: 'synced', type: DataType.ENUM('synced', 'sync_pending', 'sync_error') })
  syncStatus: string;

  // === EXAM ASSIGNMENT (FROM EXTERNAL) ===
  @ForeignKey(() => Building)
  @Column({ allowNull: false })
  buildingId: number;

  @BelongsTo(() => Building)
  building: Building;

  @ForeignKey(() => Room)
  @Column({ allowNull: false })
  roomId: number;

  @BelongsTo(() => Room)
  room: Room;

  @Column
  placeId: number; // Seat number within room

  @Column({ type: DataType.DATE, allowNull: false })
  examDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  startTime: Date;

  // === PARTICIPANT INFO ===
  @Column
  participantName: string;

  @Column
  participantId: string; // External participant/student ID

  @Column
  examTitle: string;

  // === LOCAL ATTENDANCE TRACKING ===
  @Column({ defaultValue: false })
  attendanceMarked: boolean;

  @Column({ type: DataType.ENUM('present', 'absent', 'late', 'excused') })
  attendanceStatus: string;

  @Column({ type: DataType.DATE })
  attendanceMarkedAt: Date;

  @ForeignKey(() => User)
  @Column
  attendanceMarkedBy: number; // Supervisor who marked attendance

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### New Sync Log Model

```typescript
// models/sync-log.model.ts
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({
  tableName: 'sync_logs',
  timestamps: true,
})
export class SyncLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.ENUM('exam_halls', 'hall_rooms', 'participants') })
  syncType: string;

  @Column({ type: DataType.DATE, allowNull: false })
  startedAt: Date;

  @Column({ type: DataType.DATE })
  completedAt: Date;

  @Column({ defaultValue: 'in_progress', type: DataType.ENUM('in_progress', 'completed', 'failed') })
  status: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  recordsProcessed: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  recordsCreated: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  recordsUpdated: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  recordsDeleted: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  recordsErrored: number;

  @Column({ type: DataType.TEXT })
  errorMessage: string;

  @Column({ type: DataType.JSONB })
  errorDetails: object;

  @Column({ type: DataType.JSONB })
  metadata: object; // Store additional sync info

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

---

## Synchronization Service

### Service Architecture

```typescript
// modules/sync/sync.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ExternalHallApiService } from './external-hall-api.service';
import { Building } from '../../models/building.model';
import { Room } from '../../models/room.model';
import { Participant } from '../../models/participant.model';
import { SyncLog } from '../../models/sync-log.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Building, Room, Participant, SyncLog]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SyncController],
  providers: [SyncService, ExternalHallApiService],
  exports: [SyncService],
})
export class SyncModule {}
```

### External API Service

```typescript
// modules/sync/external-hall-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ExternalHall {
  id: number;
  uid: string;
  name: string;
  address: string;
  placeLimit: number;
  regionId: number;
  rooms: ExternalRoom[];
}

interface ExternalRoom {
  id: number;
  name: string;
  capacity: number;
  examHallId?: number;
}

interface ParticipantData {
  startTime: string;
  participants: {
    hallId: number;
    hallName: string;
    roomId: number;
    roomName: string;
    participantCount: number;
  }[];
}

@Injectable()
export class ExternalHallApiService {
  private readonly logger = new Logger(ExternalHallApiService.name);
  private readonly baseUrl: string;
  private readonly authToken: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('EXTERNAL_HALL_API_URL');
    this.authToken = this.configService.get<string>('EXTERNAL_HALL_API_TOKEN');
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all exam halls with rooms
   * GET /api/external-app/exam-halls
   */
  async getExamHalls(): Promise<ExternalHall[]> {
    try {
      this.logger.log('Fetching exam halls from external API');

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/external-app/exam-halls`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Fetched ${response.data.data.length} exam halls`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch exam halls', error.stack);
      throw new Error(`External API error: ${error.message}`);
    }
  }

  /**
   * Get rooms by hall ID
   * GET /api/external-app/hall-rooms/:hallId
   */
  async getHallRooms(hallId: number): Promise<ExternalRoom[]> {
    try {
      this.logger.log(`Fetching rooms for hall ${hallId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/external-app/hall-rooms/${hallId}`, {
          headers: this.getHeaders(),
        }),
      );

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to fetch rooms for hall ${hallId}`, error.stack);
      throw new Error(`External API error: ${error.message}`);
    }
  }

  /**
   * Get room participants by exam date
   * GET /api/external-app/room-participants/:examDate
   */
  async getRoomParticipants(examDate: string): Promise<ParticipantData[]> {
    try {
      this.logger.log(`Fetching participants for date ${examDate}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/external-app/room-participants/${examDate}`, {
          headers: this.getHeaders(),
        }),
      );

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to fetch participants for ${examDate}`, error.stack);
      throw new Error(`External API error: ${error.message}`);
    }
  }
}
```

### Main Sync Service

```typescript
// modules/sync/sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Sequelize } from 'sequelize-typescript';
import { ExternalHallApiService } from './external-hall-api.service';
import { Building } from '../../models/building.model';
import { Room } from '../../models/room.model';
import { Participant } from '../../models/participant.model';
import { SyncLog } from '../../models/sync-log.model';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectModel(Building)
    private buildingModel: typeof Building,
    @InjectModel(Room)
    private roomModel: typeof Room,
    @InjectModel(Participant)
    private participantModel: typeof Participant,
    @InjectModel(SyncLog)
    private syncLogModel: typeof SyncLog,
    private externalHallApi: ExternalHallApiService,
    private sequelize: Sequelize,
  ) {}

  /**
   * Sync exam halls - Runs daily at 2 AM
   */
  @Cron('0 2 * * *')
  async syncExamHalls(): Promise<void> {
    this.logger.log('Starting exam halls sync (scheduled)');
    await this.performExamHallsSync();
  }

  /**
   * Manual trigger for exam halls sync
   */
  async performExamHallsSync(): Promise<SyncLog> {
    const syncLog = await this.syncLogModel.create({
      syncType: 'exam_halls',
      startedAt: new Date(),
      status: 'in_progress',
    });

    const transaction = await this.sequelize.transaction();

    try {
      // Fetch data from external API
      const externalHalls = await this.externalHallApi.getExamHalls();

      let created = 0;
      let updated = 0;

      for (const externalHall of externalHalls) {
        // Find or create building
        const [building, isCreated] = await this.buildingModel.findOrCreate({
          where: { externalId: externalHall.id },
          defaults: {
            externalId: externalHall.id,
            externalUid: externalHall.uid,
            name: externalHall.name,
            address: externalHall.address,
            placeLimit: externalHall.placeLimit,
            regionId: externalHall.regionId,
            isActive: true,
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
          },
          transaction,
        });

        if (isCreated) {
          created++;
          this.logger.log(`Created building: ${externalHall.name}`);
        } else {
          // Update existing building
          await building.update(
            {
              name: externalHall.name,
              address: externalHall.address,
              placeLimit: externalHall.placeLimit,
              regionId: externalHall.regionId,
              externalUid: externalHall.uid,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              syncError: null,
            },
            { transaction },
          );
          updated++;
          this.logger.log(`Updated building: ${externalHall.name}`);
        }

        // Sync nested rooms
        await this.syncRoomsForHall(building.id, externalHall.rooms, transaction);
      }

      await transaction.commit();

      // Update sync log
      await syncLog.update({
        status: 'completed',
        completedAt: new Date(),
        recordsProcessed: externalHalls.length,
        recordsCreated: created,
        recordsUpdated: updated,
      });

      this.logger.log(`Exam halls sync completed: ${created} created, ${updated} updated`);
      return syncLog;
    } catch (error) {
      await transaction.rollback();

      await syncLog.update({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message,
        errorDetails: { stack: error.stack },
      });

      this.logger.error('Exam halls sync failed', error.stack);
      throw error;
    }
  }

  /**
   * Sync rooms for a specific hall
   */
  private async syncRoomsForHall(
    buildingId: number,
    externalRooms: any[],
    transaction: any,
  ): Promise<void> {
    let created = 0;
    let updated = 0;

    for (const externalRoom of externalRooms) {
      const [room, isCreated] = await this.roomModel.findOrCreate({
        where: { externalId: externalRoom.id },
        defaults: {
          externalId: externalRoom.id,
          buildingId: buildingId,
          name: externalRoom.name,
          capacity: externalRoom.capacity,
          isActive: true,
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
        },
        transaction,
      });

      if (isCreated) {
        created++;
      } else {
        await room.update(
          {
            name: externalRoom.name,
            capacity: externalRoom.capacity,
            buildingId: buildingId,
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            syncError: null,
          },
          { transaction },
        );
        updated++;
      }
    }

    this.logger.log(`Synced rooms for building ${buildingId}: ${created} created, ${updated} updated`);
  }

  /**
   * Sync participants - Runs every 30 minutes during exam periods
   */
  @Cron('*/30 * * * *')
  async syncParticipantsScheduled(): Promise<void> {
    // Get today's date and next 7 days
    const dates = this.getUpcomingExamDates(7);

    for (const date of dates) {
      await this.syncParticipantsForDate(date);
    }
  }

  /**
   * Sync participants for a specific date
   */
  async syncParticipantsForDate(examDate: string): Promise<SyncLog> {
    const syncLog = await this.syncLogModel.create({
      syncType: 'participants',
      startedAt: new Date(),
      status: 'in_progress',
      metadata: { examDate },
    });

    const transaction = await this.sequelize.transaction();

    try {
      const participantData = await this.externalHallApi.getRoomParticipants(examDate);

      let created = 0;
      let updated = 0;

      for (const timeSlot of participantData) {
        for (const participant of timeSlot.participants) {
          // Find the building and room
          const building = await this.buildingModel.findOne({
            where: { externalId: participant.hallId },
          });

          const room = await this.roomModel.findOne({
            where: { externalId: participant.roomId },
          });

          if (!building || !room) {
            this.logger.warn(
              `Building or room not found: hallId=${participant.hallId}, roomId=${participant.roomId}`,
            );
            continue;
          }

          // Create/update participant record
          // Note: We're storing aggregate count, not individual participants
          // You might need to adjust this based on actual requirements
          const [participantRecord, isCreated] = await this.participantModel.findOrCreate({
            where: {
              buildingId: building.id,
              roomId: room.id,
              examDate: examDate,
              startTime: timeSlot.startTime,
            },
            defaults: {
              buildingId: building.id,
              roomId: room.id,
              examDate: examDate,
              startTime: timeSlot.startTime,
              participantCount: participant.participantCount,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
            },
            transaction,
          });

          if (isCreated) {
            created++;
          } else {
            await participantRecord.update(
              {
                participantCount: participant.participantCount,
                lastSyncedAt: new Date(),
                syncStatus: 'synced',
              },
              { transaction },
            );
            updated++;
          }
        }
      }

      await transaction.commit();

      await syncLog.update({
        status: 'completed',
        completedAt: new Date(),
        recordsCreated: created,
        recordsUpdated: updated,
      });

      this.logger.log(`Participants sync for ${examDate} completed: ${created} created, ${updated} updated`);
      return syncLog;
    } catch (error) {
      await transaction.rollback();

      await syncLog.update({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message,
        errorDetails: { stack: error.stack },
      });

      this.logger.error(`Participants sync for ${examDate} failed`, error.stack);
      throw error;
    }
  }

  /**
   * Get upcoming exam dates (today + N days)
   */
  private getUpcomingExamDates(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD
    }

    return dates;
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<any> {
    const lastHallsSync = await this.syncLogModel.findOne({
      where: { syncType: 'exam_halls' },
      order: [['createdAt', 'DESC']],
    });

    const lastParticipantsSync = await this.syncLogModel.findOne({
      where: { syncType: 'participants' },
      order: [['createdAt', 'DESC']],
    });

    return {
      examHalls: lastHallsSync,
      participants: lastParticipantsSync,
    };
  }
}
```

### Sync Controller

```typescript
// modules/sync/sync.controller.ts
import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Synchronization')
@ApiBearerAuth()
@Controller('api/v1/sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('exam-halls')
  @Roles('exam_director')
  @ApiOperation({ summary: 'Manually trigger exam halls sync' })
  async syncExamHalls() {
    const result = await this.syncService.performExamHallsSync();
    return {
      success: true,
      message: 'Exam halls sync completed',
      data: result,
    };
  }

  @Post('participants/:date')
  @Roles('exam_director', 'building_manager')
  @ApiOperation({ summary: 'Manually trigger participants sync for a specific date' })
  async syncParticipants(@Param('date') date: string) {
    const result = await this.syncService.syncParticipantsForDate(date);
    return {
      success: true,
      message: `Participants sync for ${date} completed`,
      data: result,
    };
  }

  @Get('status')
  @Roles('exam_director', 'building_manager')
  @ApiOperation({ summary: 'Get sync status' })
  async getSyncStatus() {
    const status = await this.syncService.getSyncStatus();
    return {
      success: true,
      data: status,
    };
  }
}
```

---

## Conflict Resolution

### Conflict Scenarios

1. **External Hall Deleted**
   - Strategy: Mark as `isActive = false`, keep historical data
   - Don't cascade delete assignments/attendance

2. **External Room Deleted**
   - Strategy: Mark as `isActive = false`
   - Existing assignments remain valid

3. **Hall/Room Renamed**
   - Strategy: Update name, log change in audit

4. **Capacity Changed**
   - Strategy: Update capacity, trigger warning if assignments exceed new capacity

### Resolution Rules

```typescript
// Conflict resolution pseudo-code
if (externalRecord.deleted) {
  localRecord.isActive = false;
  localRecord.deletedAt = now();
} else if (localRecord.isActive === false && externalRecord.exists) {
  localRecord.isActive = true;
  localRecord.deletedAt = null;
}

if (externalRecord.capacity < localRecord.assignedCount) {
  // Log warning
  logger.warn('Room capacity reduced below current assignments');
  // Notify building manager
}
```

---

## Error Handling

### Retry Strategy

```typescript
// Exponential backoff for failed syncs
const retryDelays = [1000, 5000, 15000, 60000]; // 1s, 5s, 15s, 1m

for (let attempt = 0; attempt < retryDelays.length; attempt++) {
  try {
    await syncFunction();
    break; // Success
  } catch (error) {
    if (attempt === retryDelays.length - 1) {
      // Final attempt failed
      throw error;
    }
    await sleep(retryDelays[attempt]);
  }
}
```

### Error Notifications

- Email to system administrators
- In-app notification to exam directors
- Slack/Teams webhook (optional)

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Update Building model with external fields
- [ ] Update Room model with external fields
- [ ] Create Participant model
- [ ] Create SyncLog model
- [ ] Database migrations

### Phase 2: External API Client (Week 1)
- [ ] Create ExternalHallApiService
- [ ] Implement authentication
- [ ] Implement all 3 API endpoints
- [ ] Error handling and retries
- [ ] Unit tests

### Phase 3: Sync Service (Week 2)
- [ ] Create SyncService
- [ ] Implement exam halls sync
- [ ] Implement rooms sync
- [ ] Implement participants sync
- [ ] Transaction handling
- [ ] Conflict resolution

### Phase 4: Scheduling (Week 2)
- [ ] Setup cron jobs
- [ ] Configure sync frequencies
- [ ] Implement manual triggers
- [ ] Create sync controller
- [ ] API documentation

### Phase 5: Monitoring (Week 3)
- [ ] Sync status dashboard
- [ ] Error notifications
- [ ] Sync logs viewer
- [ ] Performance monitoring
- [ ] Alerting system

---

## Configuration

### Environment Variables

```bash
# External Hall API
EXTERNAL_HALL_API_URL=https://exam-system.example.com
EXTERNAL_HALL_API_TOKEN=your-jwt-token-here

# Sync Configuration
SYNC_HALLS_CRON=0 2 * * *           # Daily at 2 AM
SYNC_PARTICIPANTS_CRON=*/30 * * * * # Every 30 minutes
SYNC_RETRY_ATTEMPTS=3
SYNC_RETRY_DELAY=5000               # 5 seconds

# Sync Notifications
SYNC_ERROR_EMAIL=admin@example.com
SYNC_WEBHOOK_URL=https://hooks.slack.com/...
```

---

## Testing Strategy

### Unit Tests
- External API service mocked
- Sync logic tested with fixtures
- Error handling tested

### Integration Tests
- Test with mock external API
- Test sync scenarios
- Test conflict resolution

### Manual Testing
- Sync from production-like external API
- Verify data integrity
- Test error scenarios

---

## Monitoring & Alerts

### Metrics to Track
- Sync success rate
- Sync duration
- Records synced per run
- API response times
- Error frequency

### Alerts
- Sync failure (> 3 consecutive failures)
- API timeout
- Data inconsistency detected
- Large data volume changes (> 50% increase)

---

## Future Enhancements

1. **Webhook Support**
   - Listen for external system changes
   - Real-time sync instead of polling

2. **Bi-directional Sync**
   - Push attendance data back to external system
   - Push violation reports

3. **Partial Sync**
   - Sync only changed records
   - Delta sync using timestamps

4. **Data Validation**
   - Validate incoming data
   - Business rule checks
   - Data quality reports

5. **Sync Queue**
   - Queue-based sync for better performance
   - Parallel processing
   - Priority-based sync

---

## Conclusion

This synchronization strategy ensures data consistency between the external exam management system and the exam supervision system while maintaining clear data ownership boundaries. The pull-based periodic sync approach provides reliability and control while keeping the systems loosely coupled.
