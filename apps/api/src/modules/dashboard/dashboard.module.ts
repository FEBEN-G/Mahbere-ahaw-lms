import { Module } from '@nestjs/common';
import { GradingModule } from '../grading/grading.module';
import { StudentsModule } from '../students/students.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [StudentsModule, SubmissionsModule, GradingModule],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
})
export class DashboardModule {}
