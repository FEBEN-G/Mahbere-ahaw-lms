import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { GradingController } from './grading.controller';
import { GradingRepository } from './grading.repository';
import { GradingService } from './grading.service';
import { InstructorsModule } from '../instructors/instructors.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    SubmissionsModule,
    InstructorsModule,
    StudentsModule,
    NotificationsModule,
  ],
  controllers: [GradingController],
  providers: [GradingService, GradingRepository],
  exports: [GradingService, GradingRepository],
})
export class GradingModule {}
