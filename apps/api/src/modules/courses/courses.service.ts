import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttachmentType, CourseStatus, Role } from '@prisma/client';
import { AccessControlService } from '../../common/services/access-control.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { computeUnlockedMonth } from '../../common/utils/drip-unlock.util';
import { getPublishedCoursesPerMonth } from '../../common/utils/program-policy';
import {
  isDuplicateUpload,
  validateUploadFile,
} from '../../common/utils/file-validation.util';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentsRepository } from '../students/students.repository';
import { CoursesRepository } from './courses.repository';
import {
  AssignInstructorDto,
  CreateCourseDto,
  CreateModuleDto,
  CreateVideoLinkDto,
  UpdateCourseDto,
} from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly storageService: StorageService,
    private readonly accessControl: AccessControlService,
    private readonly notificationsService: NotificationsService,
  ) {}

  createCourse(userId: string, dto: CreateCourseDto) {
    return this.coursesRepository.createCourse({
      title: dto.title,
      description: dto.description,
      monthNumber: dto.monthNumber,
      status: CourseStatus.DRAFT,
      createdBy: { connect: { id: userId } },
    });
  }

  async listCourses(
    userId: string,
    role: Role,
    query?: PaginationQueryDto,
  ) {
    if (role === Role.STUDENT) {
      const enrollment =
        await this.studentsRepository.findEnrollmentByUserId(userId);
      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }

      const unlockedMonth = computeUnlockedMonth(enrollment.cohortStartedAt);
      return this.coursesRepository.listCourses({
        status: CourseStatus.PUBLISHED,
        monthNumber: { lte: unlockedMonth },
      });
    }

    if (role === Role.INSTRUCTOR) {
      const courseIds =
        await this.accessControl.listInstructorAssignedCourseIds(userId);

      if (courseIds.length === 0) {
        if (query?.page && query?.pageSize) {
          return {
            items: [],
            meta: {
              page: query.page,
              pageSize: query.pageSize,
              total: 0,
              totalPages: 1,
            },
          };
        }

        return [];
      }

      const where = { id: { in: courseIds } };

      if (query?.page && query?.pageSize) {
        const [items, total] = await Promise.all([
          this.coursesRepository.listCourses(where, {
            page: query.page,
            pageSize: query.pageSize,
          }),
          this.coursesRepository.countCourses(where),
        ]);
        return {
          items,
          meta: {
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages: Math.ceil(total / query.pageSize) || 1,
          },
        };
      }

      return this.coursesRepository.listCourses(where);
    }

    if (query?.page && query?.pageSize) {
      const where = {};
      const [items, total] = await Promise.all([
        this.coursesRepository.listCourses(where, {
          page: query.page,
          pageSize: query.pageSize,
        }),
        this.coursesRepository.countCourses(where),
      ]);
      return {
        items,
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total,
          totalPages: Math.ceil(total / query.pageSize) || 1,
        },
      };
    }

    return this.coursesRepository.listCourses({});
  }

  async getCourse(userId: string, role: Role, courseId: string) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role === Role.STUDENT) {
      await this.accessControl.assertStudentUnlocked(userId, course.monthNumber);
      if (course.status !== CourseStatus.PUBLISHED) {
        throw new NotFoundException('Course not found');
      }
    }

    if (role === Role.INSTRUCTOR) {
      await this.accessControl.assertInstructorAssignedToCourse(userId, courseId);
    }

    return course;
  }

  async updateCourse(courseId: string, userId: string, dto: UpdateCourseDto) {
    await this.getAdminCourse(courseId);
    return this.coursesRepository.updateCourse(courseId, {
      ...dto,
      updatedBy: { connect: { id: userId } },
    });
  }

  async publishCourse(courseId: string, userId: string) {
    const course = await this.getAdminCourse(courseId);
    const publishedInMonth = await this.coursesRepository.countCourses({
      status: CourseStatus.PUBLISHED,
      monthNumber: course.monthNumber,
      id: { not: courseId },
    });
    const publishedCap = getPublishedCoursesPerMonth();
    if (publishedInMonth >= publishedCap) {
      throw new BadRequestException(
        `Each month allows at most ${publishedCap} published courses`,
      );
    }

    const published = await this.coursesRepository.updateCourse(courseId, {
      status: CourseStatus.PUBLISHED,
      updatedBy: { connect: { id: userId } },
    });

    await this.notifyStudentsCoursePublished(published.id, published.title, published.monthNumber);

    return published;
  }

  private async notifyStudentsCoursePublished(
    courseId: string,
    title: string,
    monthNumber: number,
  ) {
    const enrollments =
      await this.studentsRepository.listActiveEnrollmentsForMonthAccess();

    for (const enrollment of enrollments) {
      const unlockedMonth = computeUnlockedMonth(enrollment.cohortStartedAt);
      if (unlockedMonth < monthNumber) {
        continue;
      }

      await this.notificationsService.notifyUser({
        userId: enrollment.student.userId,
        title: 'New course available',
        body: `"${title}" (Month ${monthNumber}) is now available to read.`,
        eventType: 'COURSE_PUBLISHED',
        payload: { courseId, monthNumber },
      });
    }
  }

  async unpublishCourse(courseId: string, userId: string) {
    await this.getAdminCourse(courseId);
    return this.coursesRepository.updateCourse(courseId, {
      status: CourseStatus.DRAFT,
      updatedBy: { connect: { id: userId } },
    });
  }

  async deleteCourse(courseId: string, userId: string) {
    await this.getAdminCourse(courseId);
    return this.coursesRepository.softDeleteCourseAggregate(courseId, userId);
  }

  async createModule(courseId: string, dto: CreateModuleDto) {
    await this.getAdminCourse(courseId);
    return this.coursesRepository.createModule({
      title: dto.title,
      description: dto.description,
      sortOrder: dto.sortOrder ?? 0,
      course: { connect: { id: courseId } },
    });
  }

  async addVideoLink(moduleId: string, dto: CreateVideoLinkDto) {
    const moduleRecord = await this.coursesRepository.findModuleById(moduleId);
    if (!moduleRecord) {
      throw new NotFoundException('Module not found');
    }

    return this.coursesRepository.createAttachment({
      title: dto.title,
      type: AttachmentType.VIDEO_LINK,
      externalUrl: dto.externalUrl,
      module: { connect: { id: moduleId } },
    });
  }

  async addModuleFile(moduleId: string, file: Express.Multer.File) {
    validateUploadFile(file);
    const moduleRecord = await this.coursesRepository.findModuleById(moduleId);
    if (!moduleRecord) {
      throw new NotFoundException('Module not found');
    }

    const duplicateAttachment = moduleRecord.attachments.find(
      (attachment) =>
        attachment.originalName &&
        attachment.mimeType &&
        attachment.sizeBytes != null &&
        isDuplicateUpload(file, {
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
        }),
    );

    if (duplicateAttachment) {
      throw new BadRequestException('File already uploaded');
    }

    const stored = await this.storageService.saveUploadedFile(
      file,
      `modules/${moduleId}`,
    );

    const type =
      file.mimetype === 'application/pdf'
        ? AttachmentType.PDF
        : file.mimetype.includes('word')
          ? AttachmentType.DOCX
          : AttachmentType.IMAGE;

    return this.coursesRepository.createAttachment({
      title: file.originalname,
      type,
      objectKey: stored.objectKey,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      module: { connect: { id: moduleId } },
    });
  }

  async getAttachmentForDownload(
    userId: string,
    role: Role,
    attachmentId: string,
  ) {
    const attachment =
      await this.coursesRepository.findAttachmentById(attachmentId);
    if (!attachment?.objectKey) {
      throw new NotFoundException('Attachment not found');
    }

    if (role === Role.STUDENT) {
      await this.accessControl.assertStudentUnlocked(
        userId,
        attachment.module.course.monthNumber,
      );
    }

    if (role === Role.INSTRUCTOR) {
      await this.accessControl.assertInstructorAssignedToCourse(
        userId,
        attachment.module.course.id,
      );
    }

    if (!(await this.storageService.fileExists(attachment.objectKey))) {
      throw new NotFoundException('File not found in storage');
    }

    return {
      stream: await this.storageService.createReadStream(attachment.objectKey),
      mimeType: attachment.mimeType ?? 'application/octet-stream',
      originalName: attachment.originalName ?? attachment.title,
    };
  }

  assignInstructor(courseId: string, dto: AssignInstructorDto) {
    return this.coursesRepository.assignInstructor(
      courseId,
      dto.instructorProfileId,
    );
  }

  private async getAdminCourse(courseId: string) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }
}
