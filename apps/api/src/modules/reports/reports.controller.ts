import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('gradebook/export')
  @RequirePermissions(Permission.GRADEBOOK_EXPORT)
  requestExport(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.requestGradebookExport(user.id);
  }

  @Get('gradebook/exports/:jobId')
  @RequirePermissions(Permission.GRADEBOOK_EXPORT)
  getJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.reportsService.getExportJob(user.id, user.role, jobId);
  }

  @Get('gradebook/exports/:jobId/download')
  @RequirePermissions(Permission.GRADEBOOK_EXPORT)
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Res() response: Response,
  ) {
    const file = await this.reportsService.downloadExport(
      user.id,
      user.role,
      jobId,
    );
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );
    file.stream.pipe(response);
  }
}
