-- DropForeignKey (mfa_challenges may never exist on fresh databases)
DO $$
BEGIN
  IF to_regclass('public.mfa_challenges') IS NOT NULL THEN
    ALTER TABLE "mfa_challenges" DROP CONSTRAINT IF EXISTS "mfa_challenges_userId_fkey";
  END IF;
END $$;

-- DropTable
DROP TABLE IF EXISTS "mfa_challenges";

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaEnabled";
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaSecretEnc";
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaTempSecretEnc";
ALTER TABLE "users" DROP COLUMN IF EXISTS "mfaBackupHashes";
