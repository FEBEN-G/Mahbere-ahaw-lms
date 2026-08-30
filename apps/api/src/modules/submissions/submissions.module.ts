import { Module } from '@nestjs/common';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { StudentsModule } from '../students/students.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsRepository } from './submissions.repository';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [AssignmentsModule, StudentsModule, StorageModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsRepository],
  exports: [SubmissionsService, SubmissionsRepository],
})
export class SubmissionsModule {}
