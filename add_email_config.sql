-- AlterTable: Agregar campos de configuración de email
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "rfc" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_provider" TEXT DEFAULT 'NONE';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_host" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_port" INTEGER DEFAULT 587;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_user" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_password" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_from_name" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_secure" BOOLEAN DEFAULT false;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_configured" BOOLEAN DEFAULT false;
