import { Module } from '@nestjs/common';
import { ExpoPushService } from './expo-push.service';
import { PushService } from './push.service';

@Module({
  providers: [PushService, ExpoPushService],
  exports: [PushService, ExpoPushService],
})
export class PushModule {}
