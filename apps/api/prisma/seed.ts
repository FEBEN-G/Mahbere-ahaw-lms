import {
  AttachmentType,
  CourseStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { ROLE_PERMISSION_MAP } from '../src/common/constants/permissions';

const prisma = new PrismaClient();

function requireSeedEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set seed credentials in apps/api/.env (see .env.example).`,
    );
  }
  return value;
}

const ADMIN_PASSWORD = requireSeedEnv('SEED_SUPER_ADMIN_PASSWORD');
const INSTRUCTOR_PASSWORD = requireSeedEnv('SEED_INSTRUCTOR_PASSWORD');
const STUDENT_PASSWORD = requireSeedEnv('SEED_STUDENT_PASSWORD');

/** Minimal valid PDF for demo reader / offline flows */
const DEMO_PDF = Buffer.from(
  `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 55 >>stream
BT /F1 24 Tf 72 720 Td (Mahbere Ahaw Module Reading) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000373 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`,
  'utf8',
);

async function seedRolePermissions() {
  for (const role of Object.values(Role)) {
    const permissions = ROLE_PERMISSION_MAP[role] ?? [];
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_permission: { role, permission },
        },
        update: {},
        create: { role, permission },
      });
    }
  }
}

async function seedSuperAdmin() {
  const email = (
    process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@mahbereahaw.org'
  ).toLowerCase();
  const passwordHash = await argon2.hash(ADMIN_PASSWORD);

  return prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
      mustSetPassword: false,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      mustSetPassword: false,
    },
  });
}

async function seedInstructor() {
  const email = (
    process.env.SEED_INSTRUCTOR_EMAIL ?? 'instructor@mahbereahaw.org'
  ).toLowerCase();
  const passwordHash = await argon2.hash(INSTRUCTOR_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.INSTRUCTOR,
      isActive: true,
      mustSetPassword: false,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Sara',
      lastName: 'Bekele',
      role: Role.INSTRUCTOR,
      mustSetPassword: false,
    },
  });

  return prisma.instructorProfile.upsert({
    where: { userId: user.id },
    update: { title: 'Theology Instructor', deletedAt: null },
    create: { userId: user.id, title: 'Theology Instructor' },
  });
}

async function seedStudent() {
  const email = (
    process.env.SEED_STUDENT_EMAIL ?? 'student@mahbereahaw.org'
  ).toLowerCase();
  const passwordHash = await argon2.hash(STUDENT_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
      mustSetPassword: false,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Abebe',
      lastName: 'Kebede',
      role: Role.STUDENT,
      mustSetPassword: false,
    },
  });

  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { studentCode: 'STU-2026-001', deletedAt: null },
    create: { userId: user.id, studentCode: 'STU-2026-001' },
  });

  const enrollment = await prisma.enrollment.upsert({
    where: { studentId: profile.id },
    update: {
      isActive: true,
      deletedAt: null,
      cohortStartedAt: new Date(),
    },
    create: {
      studentId: profile.id,
      cohortStartedAt: new Date(),
      isActive: true,
    },
  });

  await prisma.contentReleaseCursor.upsert({
    where: {
      enrollmentId_monthNumber: {
        enrollmentId: enrollment.id,
        monthNumber: 1,
      },
    },
    update: {},
    create: {
      enrollmentId: enrollment.id,
      monthNumber: 1,
    },
  });
}

function saveDemoPdf(moduleId: string) {
  const basePath = resolve(
    process.cwd(),
    process.env.STORAGE_LOCAL_PATH ?? '../../storage/uploads',
  );
  const folder = join(basePath, 'modules', moduleId);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
  const objectKey = `modules/${moduleId}/${randomUUID()}-reading.pdf`;
  writeFileSync(join(basePath, objectKey), DEMO_PDF);
  return {
    objectKey: objectKey.replace(/\\/g, '/'),
    originalName: 'reading.pdf',
    mimeType: 'application/pdf',
    sizeBytes: DEMO_PDF.length,
  };
}

async function ensureDemoPdfAttachment(moduleId: string) {
  const existing = await prisma.attachment.findFirst({
    where: {
      moduleId,
      type: AttachmentType.PDF,
      deletedAt: null,
    },
  });
  if (existing) {
    return existing;
  }

  const stored = saveDemoPdf(moduleId);
  return prisma.attachment.create({
    data: {
      moduleId,
      title: 'Faith Foundations Reading (PDF)',
      type: AttachmentType.PDF,
      objectKey: stored.objectKey,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
    },
  });
}

async function seedDemoContent(
  adminId: string,
  instructorProfileId: string,
) {
  let courseOne = await prisma.course.findFirst({
    where: { title: 'Introduction to Theology', deletedAt: null },
    include: { modules: true },
  });

  if (!courseOne) {
    courseOne = await prisma.course.create({
      data: {
        title: 'Introduction to Theology',
        description: 'Foundations of Orthodox theology for Month 1.',
        monthNumber: 1,
        status: CourseStatus.PUBLISHED,
        createdById: adminId,
        modules: {
          create: [
            {
              title: 'Module 1: Faith Foundations',
              description: 'Core concepts and vocabulary.',
              sortOrder: 1,
              attachments: {
                create: [
                  {
                    title: 'Intro Video',
                    type: AttachmentType.VIDEO_LINK,
                    externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  },
                ],
              },
            },
          ],
        },
        assignments: {
          create: [
            {
              title: 'Reflection Essay',
              description: 'Write a 2-page reflection on Module 1.',
              dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              maxScore: 100,
            },
          ],
        },
      },
      include: { modules: true },
    });
  }

  let courseTwo = await prisma.course.findFirst({
    where: { title: 'Church History Basics', deletedAt: null },
  });

  if (!courseTwo) {
    courseTwo = await prisma.course.create({
      data: {
        title: 'Church History Basics',
        description: 'Early church history overview for Month 1.',
        monthNumber: 1,
        status: CourseStatus.PUBLISHED,
        createdById: adminId,
        modules: {
          create: [
            {
              title: 'Module 1: Early Church',
              description: 'Apostolic era through Nicaea.',
              sortOrder: 1,
            },
          ],
        },
        assignments: {
          create: [
            {
              title: 'Timeline Assignment',
              description: 'Create a timeline of key early church events.',
              dueAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
              maxScore: 100,
            },
          ],
        },
      },
    });
  }

  const moduleOne =
    courseOne.modules[0] ??
    (await prisma.module.findFirst({
      where: { courseId: courseOne.id, deletedAt: null },
    }));

  if (moduleOne) {
    await ensureDemoPdfAttachment(moduleOne.id);
  }

  await prisma.instructorCourseAssignment.createMany({
    data: [
      { instructorId: instructorProfileId, courseId: courseOne.id },
      { instructorId: instructorProfileId, courseId: courseTwo.id },
    ],
    skipDuplicates: true,
  });
}

async function main() {
  await seedRolePermissions();
  const admin = await seedSuperAdmin();
  const instructor = await seedInstructor();
  await seedStudent();
  await seedDemoContent(admin.id, instructor.id);

  console.log('Seed complete. Accounts updated (passwords not logged).');
  console.log(`  Super Admin  ${process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@mahbereahaw.org'}`);
  console.log(`  Instructor   ${process.env.SEED_INSTRUCTOR_EMAIL ?? 'instructor@mahbereahaw.org'}`);
  console.log(`  Student      ${process.env.SEED_STUDENT_EMAIL ?? 'student@mahbereahaw.org'}`);
  console.log('  Passwords: configured via SEED_* env vars (see .env.example).');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
