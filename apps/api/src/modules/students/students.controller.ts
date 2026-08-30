import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  @RequirePermissions(Permission.DASHBOARD_STUDENT)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyProfile(user.id);
  }

  @Post('me/progress/attachments/:attachmentId')
  @RequirePermissions(Permission.COURSE_READ)
  recordAttachmentProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.studentsService.recordAttachmentProgress(user.id, attachmentId);
  }
}
