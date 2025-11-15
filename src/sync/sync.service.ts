import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ExternalHallApiService } from './external-hall-api.service';
import {
  Building,
  BuildingSyncStatus,
  Room,
  RoomSyncStatus,
  Participant,
  ParticipantSyncStatus,
  SyncLog,
  SyncType,
  SyncStatus,
} from '../entities';
import { TransactionUtil } from '../common/utils/transaction.util';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
    private externalHallApi: ExternalHallApiService,
    private dataSource: DataSource,
  ) {}

  /**
   * Sync exam halls and rooms - Runs daily at 2 AM
   */
  @Cron('0 2 * * *')
  async syncExamHallsScheduled(): Promise<void> {
    this.logger.log('Starting exam halls sync (scheduled)');
    await this.performExamHallsSync();
  }

  /**
   * Manual trigger for exam halls sync
   */
  async performExamHallsSync(): Promise<SyncLog> {
    const syncLog = this.syncLogRepository.create({
      syncType: SyncType.EXAM_HALLS,
      startedAt: new Date(),
      status: SyncStatus.IN_PROGRESS,
    });
    await this.syncLogRepository.save(syncLog);

    try {
      // Fetch data from external API
      const externalHalls = await this.externalHallApi.getExamHalls();

      // Use TransactionUtil for cleaner transaction management
      const { created, updated } = await TransactionUtil.runInTransaction(
        this.dataSource,
        async (manager) => {
          let created = 0;
          let updated = 0;

          for (const externalHall of externalHalls) {
            // Find existing building by external ID
            let building = await manager.findOne(Building, {
              where: { externalId: externalHall.id },
            });

            if (!building) {
              // Create new building
              building = manager.create(Building, {
                externalId: externalHall.id,
                externalUid: externalHall.uid,
                name: externalHall.name,
                address: externalHall.address,
                placeLimit: externalHall.placeLimit,
                regionId: externalHall.regionId,
                active: externalHall.isActive === 1,
                lastSyncedAt: new Date(),
                syncStatus: BuildingSyncStatus.SYNCED,
              });
              await manager.save(building);
              created++;
              this.logger.log(`Created building: ${externalHall.name}`);
            } else {
              // Update existing building
              building.name = externalHall.name;
              building.address = externalHall.address;
              building.placeLimit = externalHall.placeLimit;
              building.regionId = externalHall.regionId;
              building.externalUid = externalHall.uid;
              building.active = externalHall.isActive === 1;
              building.lastSyncedAt = new Date();
              building.syncStatus = BuildingSyncStatus.SYNCED;
              building.syncError = null;
              await manager.save(building);
              updated++;
              this.logger.log(`Updated building: ${externalHall.name}`);
            }

            // Sync nested rooms
            await this.syncRoomsForHall(building.id, externalHall.rooms, manager);
          }

          return { created, updated };
        },
      );

      // Update sync log
      syncLog.status = SyncStatus.COMPLETED;
      syncLog.completedAt = new Date();
      syncLog.recordsProcessed = externalHalls.length;
      syncLog.recordsCreated = created;
      syncLog.recordsUpdated = updated;
      await this.syncLogRepository.save(syncLog);

      this.logger.log(
        `Exam halls sync completed: ${created} created, ${updated} updated`,
      );
      return syncLog;
    } catch (error) {
      syncLog.status = SyncStatus.FAILED;
      syncLog.completedAt = new Date();
      syncLog.errorMessage = error.message;
      syncLog.errorDetails = { stack: error.stack };
      await this.syncLogRepository.save(syncLog);

      this.logger.error('Exam halls sync failed', error.stack);
      throw error;
    }
  }

  /**
   * Sync rooms for a specific hall
   */
  private async syncRoomsForHall(
    buildingId: string,
    externalRooms: any[],
    manager: EntityManager,
  ): Promise<void> {
    let created = 0;
    let updated = 0;

    for (const externalRoom of externalRooms) {
      let room = await manager.findOne(Room, {
        where: { externalId: externalRoom.id },
      });

      if (!room) {
        // Create new room
        room = manager.create(Room, {
          externalId: externalRoom.id,
          buildingId: buildingId,
          name: externalRoom.name,
          number: externalRoom.name || `Room ${externalRoom.id}`,
          capacity: externalRoom.capacity,
          active: externalRoom.isActive === 1,
          lastSyncedAt: new Date(),
          syncStatus: RoomSyncStatus.SYNCED,
        });
        await manager.save(room);
        created++;
      } else {
        // Update existing room
        room.name = externalRoom.name;
        room.number = externalRoom.name || `Room ${externalRoom.id}`;
        room.capacity = externalRoom.capacity;
        room.buildingId = buildingId;
        room.active = externalRoom.isActive === 1;
        room.lastSyncedAt = new Date();
        room.syncStatus = RoomSyncStatus.SYNCED;
        room.syncError = null;
        await manager.save(room);
        updated++;
      }
    }

    this.logger.log(
      `Synced rooms for building ${buildingId}: ${created} created, ${updated} updated`,
    );
  }

  /**
   * Sync participants - Runs daily at 3 AM for next 3 days
   */
  @Cron('0 3 * * *')
  async syncParticipantsScheduled(): Promise<void> {
    this.logger.log('Starting participants sync for next 3 days (scheduled)');
    // Get today, tomorrow, and day after tomorrow
    const dates = this.getUpcomingExamDates(3);

    for (const date of dates) {
      try {
        await this.syncParticipantsForDate(date);
      } catch (error) {
        this.logger.error(
          `Failed to sync participants for ${date}`,
          error.stack,
        );
        // Continue with next date even if one fails
      }
    }
  }

  /**
   * Sync participants for a specific date
   */
  async syncParticipantsForDate(examDate: string): Promise<SyncLog> {
    const syncLog = this.syncLogRepository.create({
      syncType: SyncType.PARTICIPANTS,
      startedAt: new Date(),
      status: SyncStatus.IN_PROGRESS,
      metadata: { examDate },
    });
    await this.syncLogRepository.save(syncLog);

    try {
      const participantData =
        await this.externalHallApi.getRoomParticipants(examDate);

      // Use TransactionUtil for cleaner transaction management
      const { created, updated } = await TransactionUtil.runInTransaction(
        this.dataSource,
        async (manager) => {
          let created = 0;
          let updated = 0;

          for (const timeSlot of participantData) {
            for (const participantRoom of timeSlot.participants) {
              // Find the building and room
              const building = await manager.findOne(Building, {
                where: { externalId: participantRoom.hallId },
              });

              const room = await manager.findOne(Room, {
                where: { externalId: participantRoom.roomId },
              });

              if (!building || !room) {
                this.logger.warn(
                  `Building or room not found: hallId=${participantRoom.hallId}, roomId=${participantRoom.roomId}`,
                );
                continue;
              }

              // Find existing participant record
              let participant = await manager.findOne(Participant, {
                where: {
                  buildingId: building.id,
                  roomId: room.id,
                  examDate: new Date(examDate),
                  startTime: timeSlot.startTime,
                },
              });

              if (!participant) {
                // Create new participant record
                participant = manager.create(Participant, {
                  buildingId: building.id,
                  roomId: room.id,
                  examDate: new Date(examDate),
                  startTime: timeSlot.startTime,
                  participantCount: participantRoom.participantCount,
                  lastSyncedAt: new Date(),
                  syncStatus: ParticipantSyncStatus.SYNCED,
                });
                await manager.save(participant);
                created++;
              } else {
                // Update existing participant record
                participant.participantCount = participantRoom.participantCount;
                participant.lastSyncedAt = new Date();
                participant.syncStatus = ParticipantSyncStatus.SYNCED;
                await manager.save(participant);
                updated++;
              }
            }
          }

          return { created, updated };
        },
      );

      syncLog.status = SyncStatus.COMPLETED;
      syncLog.completedAt = new Date();
      syncLog.recordsCreated = created;
      syncLog.recordsUpdated = updated;
      await this.syncLogRepository.save(syncLog);

      this.logger.log(
        `Participants sync for ${examDate} completed: ${created} created, ${updated} updated`,
      );
      return syncLog;
    } catch (error) {
      syncLog.status = SyncStatus.FAILED;
      syncLog.completedAt = new Date();
      syncLog.errorMessage = error.message;
      syncLog.errorDetails = { stack: error.stack };
      await this.syncLogRepository.save(syncLog);

      this.logger.error(
        `Participants sync for ${examDate} failed`,
        error.stack,
      );
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
    const lastHallsSync = await this.syncLogRepository.findOne({
      where: { syncType: SyncType.EXAM_HALLS },
      order: { createdAt: 'DESC' },
    });

    const lastParticipantsSync = await this.syncLogRepository.findOne({
      where: { syncType: SyncType.PARTICIPANTS },
      order: { createdAt: 'DESC' },
    });

    return {
      examHalls: lastHallsSync,
      participants: lastParticipantsSync,
    };
  }
}
