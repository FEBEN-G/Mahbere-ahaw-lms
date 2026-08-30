import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { createUploadInterceptorOptions } from '../../common/utils/upload-multer.util';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SubmissionsService } from './submissions.service';

@ApiTags('submissions')
@ApiBearerAuth()
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get('my')
  @RequirePermissions(Permission.SUBMISSION_CREATE)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.submissionsService.listMine(user.id);
  }

  @Get('my/:id/download')
  @RequirePermissions(Permission.SUBMISSION_CREATE)
  async downloadStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const file = await this.submissionsService.getDownload(
      user.id,
      user.role,
      id,
    );
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );
    file.stream.pipe(response);
  }

  @Post('assignments/:assignmentId')
  @RequirePermissions(Permission.SUBMISSION_CREATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', createUploadInterceptorOptions()))
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.submissionsService.submit(user.id, assignmentId, file);
  }

  @Get('assignments/:assignmentId')
  @RequirePermissions(Permission.SUBMISSION_READ)
  listForAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.submissionsService.listForAssignment(
      user.id,
      user.role,
      assignmentId,
    );
  }

  @Get(':id/download')
  @RequirePermissions(Permission.SUBMISSION_READ)
  async downloadInstructor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const file = await this.submissionsService.getDownload(
      user.id,
      user.role,
      id,
    );
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );
    file.stream.pipe(response);
  }
}
