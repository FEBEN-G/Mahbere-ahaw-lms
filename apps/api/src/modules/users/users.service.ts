import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { computeUnlockedMonth } from '../../common/utils/drip-unlock.util';
import { generateTemporaryPassword } from '../../common/utils/temporary-password.util';
import { MailService } from '../../infrastructure/mail/mail.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async createStudent(dto: CreateStudentDto) {
    await this.ensureEmailAvailable(dto.email);

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await argon2.hash(temporaryPassword);
    const cohortStartedAt = dto.cohortStartedAt
      ? new Date(dto.cohortStartedAt)
      : new Date();

    const user = await this.usersRepository.createStudentWithEnrollment({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      studentCode: dto.studentCode,
      cohortStartedAt,
      mustSetPassword: false,
    });

    const unlockedMonth = computeUnlockedMonth(cohortStartedAt);
    await this.sendCredentialsEmail({
      email: user.email,
      firstName: user.firstName,
      temporaryPassword,
      roleLabel: 'student',
    });

    return {
      user: this.toPublicUser(user),
      enrollment: {
        cohortStartedAt,
        unlockedMonth,
      },
      temporaryPassword,
    };
  }

  async createInstructor(dto: CreateInstructorDto) {
    await this.ensureEmailAvailable(dto.email);

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await argon2.hash(temporaryPassword);

    const user = await this.usersRepository.createInstructor({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      title: dto.title,
      mustSetPassword: false,
    });

    await this.sendCredentialsEmail({
      email: user.email,
      firstName: user.firstName,
      temporaryPassword,
      roleLabel: 'instructor',
    });

    return {
      user: this.toPublicUser(user),
      temporaryPassword,
    };
  }

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { total, items } = await this.usersRepository.list({
      page,
      pageSize,
      role: query.role,
    });

    return {
      items: items.map((user) => {
        const cohortStartedAt =
          user.studentProfile?.enrollment?.cohortStartedAt ?? null;

        return {
          ...user,
          unlockedMonth: cohortStartedAt
            ? computeUnlockedMonth(cohortStartedAt)
            : null,
        };
      }),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cohortStartedAt =
      user.studentProfile?.enrollment?.cohortStartedAt ?? null;

    return {
      ...this.toPublicUser(user),
      studentProfile: user.studentProfile,
      instructorProfile: user.instructorProfile,
      unlockedMonth: cohortStartedAt
        ? computeUnlockedMonth(cohortStartedAt)
        : null,
    };
  }

  async setActive(id: string, isActive: boolean) {
    await this.getById(id);
    const user = await this.usersRepository.setActive(id, isActive);
    return this.toPublicUser(user);
  }

  async softDelete(id: string) {
    await this.getById(id);
    const user = await this.usersRepository.softDelete(id);
    return this.toPublicUser(user);
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
  }

  private async sendCredentialsEmail(input: {
    email: string;
    firstName: string;
    temporaryPassword: string;
    roleLabel: 'student' | 'instructor';
  }) {
    const webUrl =
      this.configService.get<string>('web.publicUrl') ?? 'http://localhost:3000';
    try {
      await this.mailService.sendMail({
        to: input.email,
        subject: 'Your Mahbere Ahaw LMS account',
        text: `Hello ${input.firstName},\n\nYour ${input.roleLabel} account is ready.\n\nSign in: ${webUrl}/login\nEmail: ${input.email}\nTemporary password: ${input.temporaryPassword}\n\nPlease change your password after first login if possible.`,
        html: `<p>Hello ${input.firstName},</p><p>Your <strong>${input.roleLabel}</strong> account is ready.</p><p><a href="${webUrl}/login">Sign in</a></p><p>Email: <code>${input.email}</code><br/>Temporary password: <code>${input.temporaryPassword}</code></p>`,
      });
    } catch (error) {
      this.logger.error({
        msg: 'credentials_email_failed',
        email: input.email,
        error: String(error),
      });
    }
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
