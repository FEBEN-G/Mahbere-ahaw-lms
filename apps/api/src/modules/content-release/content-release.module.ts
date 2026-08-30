import { Module } from '@nestjs/common';
import { QueuesModule } from '../../infrastructure/queues/queues.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContentReleaseProcessor } from './content-release.processor';
import { ContentReleaseService } from './content-release.service';

@Module({
  imports: [QueuesModule, NotificationsModule],
  providers: [ContentReleaseService, ContentReleaseProcessor],
})
export class ContentReleaseModule {}
