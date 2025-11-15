import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SyncModule } from './sync/sync.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { HallsModule } from './modules/halls/halls.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ExamsModule } from './modules/exams/exams.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ViolationsModule } from './modules/violations/violations.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { HealthModule } from './health/health.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { EmailModule } from './common/email/email.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/services/logger.service';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // Configuration module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),

    // Database module
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        // Only use synchronize in development - use migrations in production
        synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
        migrationsRun: process.env.NODE_ENV === 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),

    // Rate limiting module
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (1 minute)
        limit: 100, // Maximum number of requests per ttl (100 requests per minute)
      },
    ]),

    // Feature modules
    AuthModule,
    SyncModule,
    HealthModule,
    MonitoringModule,
    EmailModule,

    // Core modules
    UsersModule,
    BuildingsModule,
    HallsModule,
    RoomsModule,
    ExamsModule,
    AssignmentsModule,
    AttendanceModule,
    ViolationsModule,
    FeedbackModule,
    NotificationsModule,
    DocumentsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
