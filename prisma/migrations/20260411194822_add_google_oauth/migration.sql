-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "google_id" TEXT;

-- Ensure every user has at least one authentication credential
ALTER TABLE "users"
  ADD CONSTRAINT "users_auth_method_check"
  CHECK ("password_hash" IS NOT NULL OR "google_id" IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
