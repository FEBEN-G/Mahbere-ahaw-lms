-- AlterTable
ALTER TABLE "users" ADD COLUMN "mustSetPassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "account_invite_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_invite_tokens_tokenHash_key" ON "account_invite_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "account_invite_tokens_userId_idx" ON "account_invite_tokens"("userId");

-- CreateIndex
CREATE INDEX "account_invite_tokens_expiresAt_idx" ON "account_invite_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "account_invite_tokens" ADD CONSTRAINT "account_invite_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
