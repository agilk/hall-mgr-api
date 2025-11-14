import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room } from '../../entities/room.entity';
import { Hall } from '../../entities/hall.entity';
import { Building } from '../../entities/building.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Hall, Building])],
  controllers: [RoomsController],
  providers: [RoomsService, LoggerService],
  exports: [RoomsService],
})
export class RoomsModule {}
