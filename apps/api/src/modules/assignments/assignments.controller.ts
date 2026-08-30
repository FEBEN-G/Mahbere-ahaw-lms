import {
  Body,
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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('courses/:courseId')
  @RequirePermissions(Permission.ASSIGNMENT_MANAGE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', createUploadInterceptorOptions()))
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateAssignmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.assignmentsService.create(courseId, dto, file);
  }

  @Get('my')
  @RequirePermissions(Permission.COURSE_READ)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.assignmentsService.listForUser(user.id, user.role);
  }

  @Get('courses/:courseId')
  @RequirePermissions(Permission.COURSE_READ)
  listByCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.assignmentsService.listByCourse(user.id, user.role, courseId);
  }

  @Get(':id')
  @RequirePermissions(Permission.COURSE_READ)
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.getById(user.id, user.role, id);
  }

  @Get(':id/download')
  @RequirePermissions(Permission.COURSE_READ)
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const file = await this.assignmentsService.downloadPrompt(
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
