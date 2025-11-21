-- Agregar campos de configuración de email a la tabla companies
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "rfc" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_provider" TEXT DEFAULT 'NONE';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_host" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_port" INTEGER DEFAULT 587;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_user" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_password" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_from_name" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_secure" BOOLEAN DEFAULT false;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email_configured" BOOLEAN DEFAULT false;

-- Crear enums para EmailLog si no existen
DO $$ BEGIN
    CREATE TYPE "EmailType" AS ENUM (
        'ACCOUNT_STATEMENT',
        'PAYMENT_REMINDER',
        'PAYMENT_CONFIRMATION',
        'OVERDUE_NOTICE',
        'WELCOME',
        'PASSWORD_RESET',
        'INVOICE',
        'RECEIPT',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EmailStatus" AS ENUM (
        'PENDING',
        'SENT',
        'DELIVERED',
        'OPENED',
        'CLICKED',
        'BOUNCED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla email_logs si no existe
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "type" "EmailType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "message_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- Crear índices para email_logs si no existen
CREATE INDEX IF NOT EXISTS "email_logs_company_id_idx" ON "email_logs"("company_id");
CREATE INDEX IF NOT EXISTS "email_logs_customer_id_idx" ON "email_logs"("customer_id");
CREATE INDEX IF NOT EXISTS "email_logs_type_idx" ON "email_logs"("type");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX IF NOT EXISTS "email_logs_sent_at_idx" ON "email_logs"("sent_at");
