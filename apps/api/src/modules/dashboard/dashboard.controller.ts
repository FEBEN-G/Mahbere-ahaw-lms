import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DashboardService } from './dashboard.service';

class MetricsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(90)
  days = 14;
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @RequirePermissions(Permission.DASHBOARD_ADMIN)
  adminSummary() {
    return this.dashboardService.getAdminSummary();
  }

  @Get('admin/metrics')
  @RequirePermissions(Permission.DASHBOARD_ADMIN)
  adminMetrics(@Query() query: MetricsQueryDto) {
    return this.dashboardService.getAdminMetrics(query.days);
  }

  @Get('student')
  @RequirePermissions(Permission.DASHBOARD_STUDENT)
  studentSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getStudentSummary(user.id);
  }

  @Get('instructor')
  @RequirePermissions(Permission.DASHBOARD_INSTRUCTOR)
  instructorSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getInstructorSummary(user.id);
  }
}
