-- AlterEnum
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'SETTINGS_MANAGE';

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "dripDaysPerMonth" INTEGER NOT NULL DEFAULT 30,
    "publishedCoursesPerMonth" INTEGER NOT NULL DEFAULT 2,
    "maxUploadMb" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "system_settings" ("id", "dripDaysPerMonth", "publishedCoursesPerMonth", "maxUploadMb", "updatedAt")
VALUES (gen_random_uuid(), 30, 2, 10, CURRENT_TIMESTAMP);
