import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { InstructorsService } from './instructors.service';

@ApiTags('instructors')
@ApiBearerAuth()
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Get('me')
  @RequirePermissions(Permission.DASHBOARD_INSTRUCTOR)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.instructorsService.getMyProfile(user.id);
  }
}
