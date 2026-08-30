import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { MailService } from '../../infrastructure/mail/mail.service';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  const usersRepository = {
    findByEmail: jest.fn(),
    createStudentWithEnrollment: jest.fn(),
    createInstructor: jest.fn(),
  };
  const mailService = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };
  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  const service = new UsersService(
    usersRepository as unknown as UsersRepository,
    mailService as unknown as MailService,
    configService as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a student with enrollment, temporary password, and welcome email', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.createStudentWithEnrollment.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      firstName: 'Abebe',
      lastName: 'Kebede',
      role: Role.STUDENT,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.createStudent({
      email: 'student@example.com',
      firstName: 'Abebe',
      lastName: 'Kebede',
      cohortStartedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(12);
    expect(result.enrollment.unlockedMonth).toBeGreaterThanOrEqual(1);
    expect(usersRepository.createStudentWithEnrollment).toHaveBeenCalled();
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'student@example.com',
        subject: 'Your Mahbere Ahaw LMS account',
      }),
    );
  });

  it('rejects duplicate emails', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(
      service.createStudent({
        email: 'student@example.com',
        firstName: 'Abebe',
        lastName: 'Kebede',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mailService.sendMail).not.toHaveBeenCalled();
  });
});
