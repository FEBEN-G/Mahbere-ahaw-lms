-- DropForeignKey
ALTER TABLE "mfa_challenges" DROP CONSTRAINT IF EXISTS "mfa_challenges_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "mfa_challenges";

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaEnabled";
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaSecretEnc";
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaTempSecretEnc";
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaBackupHashes";
