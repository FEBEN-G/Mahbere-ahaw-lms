import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateGradeDto } from './dto/create-grade.dto';
import { GradingService } from './grading.service';

@ApiTags('grading')
@ApiBearerAuth()
@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Post('submissions/:submissionId')
  @RequirePermissions(Permission.GRADE_CREATE)
  gradeSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() dto: CreateGradeDto,
  ) {
    return this.gradingService.gradeSubmission(user.id, submissionId, dto);
  }

  @Patch('grades/:gradeId/publish')
  @RequirePermissions(Permission.GRADE_PUBLISH)
  publishGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
  ) {
    return this.gradingService.publishGrade(user.id, gradeId);
  }

  @Get('my')
  @RequirePermissions(Permission.GRADE_READ)
  listMyGrades(@CurrentUser() user: AuthenticatedUser) {
    return this.gradingService.listMyGrades(user.id);
  }

  @Get('gradebook')
  @RequirePermissions(Permission.GRADEBOOK_EXPORT)
  gradebook(@Query() query: PaginationQueryDto) {
    return this.gradingService.listGradebook(query.page, query.pageSize);
  }
}
