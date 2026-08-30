import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { createUploadInterceptorOptions } from '../../common/utils/upload-multer.util';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CoursesService } from './courses.service';
import {
  AssignInstructorDto,
  CreateCourseDto,
  CreateModuleDto,
  CreateVideoLinkDto,
  UpdateCourseDto,
} from './dto/course.dto';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @RequirePermissions(Permission.COURSE_CREATE)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(user.id, dto);
  }

  @Get()
  @RequirePermissions(Permission.COURSE_READ)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.coursesService.listCourses(user.id, user.role, query);
  }

  @Get('attachments/:attachmentId/download')
  @RequirePermissions(Permission.COURSE_READ)
  async downloadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res() response: Response,
  ) {
    const file = await this.coursesService.getAttachmentForDownload(
      user.id,
      user.role,
      attachmentId,
    );
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );
    file.stream.pipe(response);
  }

  @Post('modules/:moduleId/attachments/file')
  @RequirePermissions(Permission.MODULE_MANAGE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', createUploadInterceptorOptions()))
  uploadAttachment(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.coursesService.addModuleFile(moduleId, file);
  }

  @Post('modules/:moduleId/attachments/video')
  @RequirePermissions(Permission.MODULE_MANAGE)
  addVideoLink(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: CreateVideoLinkDto,
  ) {
    return this.coursesService.addVideoLink(moduleId, dto);
  }

  @Get(':id')
  @RequirePermissions(Permission.COURSE_READ)
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coursesService.getCourse(user.id, user.role, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.COURSE_UPDATE)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(id, user.id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(Permission.COURSE_PUBLISH)
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coursesService.publishCourse(id, user.id);
  }

  @Post(':id/unpublish')
  @RequirePermissions(Permission.COURSE_PUBLISH)
  unpublish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coursesService.unpublishCourse(id, user.id);
  }

  @Delete(':id')
  @RequirePermissions(Permission.COURSE_DELETE)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coursesService.deleteCourse(id, user.id);
  }

  @Post(':id/modules')
  @RequirePermissions(Permission.MODULE_MANAGE)
  createModule(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.coursesService.createModule(courseId, dto);
  }

  @Post(':id/instructors')
  @RequirePermissions(Permission.COURSE_UPDATE)
  assignInstructor(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: AssignInstructorDto,
  ) {
    return this.coursesService.assignInstructor(courseId, dto);
  }
}
