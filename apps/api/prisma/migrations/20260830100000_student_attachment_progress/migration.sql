-- CreateTable
CREATE TABLE "student_attachment_progress" (
    "id" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "attachmentId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_attachment_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_attachment_progress_studentProfileId_attachmentId_key" ON "student_attachment_progress"("studentProfileId", "attachmentId");

-- CreateIndex
CREATE INDEX "student_attachment_progress_studentProfileId_idx" ON "student_attachment_progress"("studentProfileId");

-- AddForeignKey
ALTER TABLE "student_attachment_progress" ADD CONSTRAINT "student_attachment_progress_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attachment_progress" ADD CONSTRAINT "student_attachment_progress_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
