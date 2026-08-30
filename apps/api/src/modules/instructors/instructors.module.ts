import { Module } from '@nestjs/common';
import { SubmissionsModule } from '../submissions/submissions.module';
import { InstructorsController } from './instructors.controller';
import { InstructorsRepository } from './instructors.repository';
import { InstructorsService } from './instructors.service';

@Module({
  imports: [SubmissionsModule],
  controllers: [InstructorsController],
  providers: [InstructorsService, InstructorsRepository],
  exports: [InstructorsService, InstructorsRepository],
})
export class InstructorsModule {}
