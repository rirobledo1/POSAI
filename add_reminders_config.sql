-- Agregar campos de configuración de recordatorios
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminders_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminder_days_before" INTEGER DEFAULT 7;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminder_days_after" INTEGER[] DEFAULT ARRAY[1, 3, 7];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminder_time" TEXT DEFAULT '09:00';
