import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission, Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ROLE_PERMISSION_MAP } from '../../common/constants/permissions';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  get() {
    return this.settingsService.getSettings();
  }

  @Get('access-levels')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  accessLevels() {
    return Object.values(Role).map((role) => ({
      role,
      permissions: ROLE_PERMISSION_MAP[role],
    }));
  }

  @Patch()
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSystemSettingsDto,
  ) {
    return this.settingsService.updateSettings(dto, user.id);
  }
}
