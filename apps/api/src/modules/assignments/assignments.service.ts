import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, Role } from '@prisma/client';
import { AccessControlService } from '../../common/services/access-control.service';
import { computeUnlockedMonth } from '../../common/utils/drip-unlock.util';
import { validateUploadFile } from '../../common/utils/file-validation.util';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { CoursesRepository } from '../courses/courses.repository';
import { StudentsRepository } from '../students/students.repository';
import { AssignmentsRepository } from './assignments.repository';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly assignmentsRepository: AssignmentsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly storageService: StorageService,
    private readonly accessControl: AccessControlService,
  ) {}

  async create(
    courseId: string,
    dto: CreateAssignmentDto,
    file?: Express.Multer.File,
  ) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    let objectKey: string | undefined;
    let originalName: string | undefined;
    let mimeType: string | undefined;

    if (file) {
      validateUploadFile(file);
      const stored = await this.storageService.saveUploadedFile(
        file,
        `assignments/${courseId}`,
      );
      objectKey = stored.objectKey;
      originalName = stored.originalName;
      mimeType = stored.mimeType;
    }

    return this.assignmentsRepository.create({
      title: dto.title,
      description: dto.description,
      dueAt: new Date(dto.dueAt),
      maxScore: dto.maxScore ?? 100,
      objectKey,
      originalName,
      mimeType,
      course: { connect: { id: courseId } },
    });
  }

  async update(
    assignmentId: string,
    dto: UpdateAssignmentDto,
    file?: Express.Multer.File,
  ) {
    const assignment = await this.assignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    let objectKey: string | undefined;
    let originalName: string | undefined;
    let mimeType: string | undefined;

    if (file) {
      validateUploadFile(file);
      const stored = await this.storageService.saveUploadedFile(
        file,
        `assignments/${assignment.courseId}`,
      );
      objectKey = stored.objectKey;
      originalName = stored.originalName;
      mimeType = stored.mimeType;
    }

    return this.assignmentsRepository.update(assignmentId, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.dueAt !== undefined ? { dueAt: new Date(dto.dueAt) } : {}),
      ...(dto.maxScore !== undefined ? { maxScore: dto.maxScore } : {}),
      ...(objectKey
        ? {
            objectKey,
            originalName,
            mimeType,
          }
        : {}),
    });
  }

  async softDelete(assignmentId: string) {
    const assignment = await this.assignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return this.assignmentsRepository.softDelete(assignmentId);
  }

  async listForUser(userId: string, role: Role) {
    if (role !== Role.STUDENT) {
      return [];
    }

    const enrollment =
      await this.studentsRepository.findEnrollmentByUserId(userId);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const unlockedMonth = computeUnlockedMonth(enrollment.cohortStartedAt);
    const courses = await this.coursesRepository.listCourses({
      status: CourseStatus.PUBLISHED,
      monthNumber: { lte: unlockedMonth },
    });
    const unlockedCourseIds = courses.map((course) => course.id);

    const profile = await this.studentsRepository.findByUserId(userId);
    const assignments =
      await this.assignmentsRepository.listForStudent(unlockedCourseIds);

    return assignments.map((assignment) => {
      const submission = assignment.submissions.find(
        (item) => item.studentId === profile?.id,
      );
      return {
        ...assignment,
        mySubmission: submission ?? null,
      };
    });
  }

  async listByCourse(userId: string, role: Role, courseId: string) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role === Role.STUDENT) {
      await this.accessControl.assertStudentUnlocked(userId, course.monthNumber);
    }

    if (role === Role.INSTRUCTOR) {
      await this.accessControl.assertInstructorAssignedToCourse(
        userId,
        courseId,
      );
    }

    return this.assignmentsRepository.listByCourse(courseId);
  }

  async getById(userId: string, role: Role, assignmentId: string) {
    const assignment = await this.assignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (role === Role.STUDENT) {
      await this.accessControl.assertStudentUnlocked(
        userId,
        assignment.course.monthNumber,
      );
    }

    if (role === Role.INSTRUCTOR) {
      await this.accessControl.assertInstructorAssignedToCourse(
        userId,
        assignment.courseId,
      );
    }

    return assignment;
  }

  async downloadPrompt(userId: string, role: Role, assignmentId: string) {
    const assignment = await this.getById(userId, role, assignmentId);
    if (!assignment.objectKey) {
      throw new NotFoundException('Assignment file not available');
    }
    if (!(await this.storageService.fileExists(assignment.objectKey))) {
      throw new NotFoundException('Assignment file not found');
    }

    return {
      stream: await this.storageService.createReadStream(assignment.objectKey),
      mimeType: assignment.mimeType ?? 'application/octet-stream',
      originalName: assignment.originalName ?? `${assignment.title}.pdf`,
    };
  }
}
