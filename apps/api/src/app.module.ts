import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AccessControlModule } from './common/services/access-control.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { PushModule } from './infrastructure/push/push.module';
import { QueuesModule } from './infrastructure/queues/queues.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentReleaseModule } from './modules/content-release/content-release.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { GradingModule } from './modules/grading/grading.module';
import { HealthModule } from './modules/health/health.module';
import { InstructorsModule } from './modules/instructors/instructors.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StudentsModule } from './modules/students/students.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const header = req.headers['x-request-id'];
          const id =
            typeof header === 'string' && header.length > 0
              ? header
              : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return {
          throttlers: [
            {
              ttl: 60_000,
              limit: 120,
            },
          ],
          storage: new ThrottlerStorageRedisService(
            new Redis(redisUrl, { maxRetriesPerRequest: null }),
          ),
        };
      },
    }),
    ScheduleModule.forRoot(),
    AccessControlModule,
    QueuesModule,
    StorageModule,
    MailModule,
    PushModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    InstructorsModule,
    CoursesModule,
    AssignmentsModule,
    SubmissionsModule,
    GradingModule,
    DashboardModule,
    NotificationsModule,
    ReportsModule,
    SettingsModule,
    ContentReleaseModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
