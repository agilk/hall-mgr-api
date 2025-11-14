import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HallsController } from './halls.controller';
import { HallsService } from './halls.service';
import { Hall } from '../../entities/hall.entity';
import { Building } from '../../entities/building.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hall, Building])],
  controllers: [HallsController],
  providers: [HallsService, LoggerService],
  exports: [HallsService],
})
export class HallsModule {}
