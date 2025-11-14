import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ExternalHallApiService } from './external-hall-api.service';
import {
  Building,
  Room,
  Participant,
  SyncLog,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Building, Room, Participant, SyncLog]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SyncController],
  providers: [SyncService, ExternalHallApiService],
  exports: [SyncService],
})
export class SyncModule {}
