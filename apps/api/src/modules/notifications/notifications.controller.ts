import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  DeleteDevicePushTokenDto,
  RegisterDevicePushTokenDto,
} from './dto/device-push-token.dto';
import {
  CreatePushSubscriptionDto,
  DeletePushSubscriptionDto,
} from './dto/push-subscription.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions(Permission.NOTIFICATION_READ)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listForUser(user.id);
  }

  @Post('push-subscriptions')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  savePush(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePushSubscriptionDto,
  ) {
    return this.notificationsService.savePushSubscription(user.id, dto);
  }

  @Delete('push-subscriptions')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  removePush(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeletePushSubscriptionDto,
  ) {
    return this.notificationsService.removePushSubscription(
      user.id,
      dto.endpoint,
    );
  }

  @Post('device-tokens')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  saveDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDevicePushTokenDto,
  ) {
    return this.notificationsService.saveDevicePushToken(user.id, dto);
  }

  @Delete('device-tokens')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  removeDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteDevicePushTokenDto,
  ) {
    return this.notificationsService.removeDevicePushToken(user.id, dto.token);
  }

  @Patch(':id/read')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markRead(user.id, id);
  }
}
