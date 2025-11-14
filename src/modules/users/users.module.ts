import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Building } from '../../entities/building.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Building])],
  controllers: [UsersController],
  providers: [UsersService, LoggerService],
  exports: [UsersService],
})
export class UsersModule {}
