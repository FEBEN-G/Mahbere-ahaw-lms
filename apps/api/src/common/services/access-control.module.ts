import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  providers: [AccessControlService, PermissionsService],
  exports: [AccessControlService, PermissionsService],
})
export class AccessControlModule {}
