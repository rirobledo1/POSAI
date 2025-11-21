#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCompanySettings() {
  try {
    console.log('🔄 Actualizando configuración de empresa con campos faltantes...');
    
    // Agregar columnas faltantes
    const alterCommands = [
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "name" TEXT`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "business_name" TEXT`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "tax_id" TEXT`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "city" TEXT`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "state" TEXT`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "country" TEXT`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "postal_code" TEXT`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'MXN'`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'America/Mexico_City'`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "fiscal_year" TEXT DEFAULT 'enero'`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "tax_percentage" DECIMAL(5,2) DEFAULT 16.0`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "invoice_prefix" TEXT DEFAULT 'FAC'`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "quote_prefix" TEXT DEFAULT 'COT'`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "receipt_prefix" TEXT DEFAULT 'REC'`,
      `ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "logo" TEXT`
    ];
    
    // Ejecutar cada comando individualmente
    for (let i = 0; i < alterCommands.length; i++) {
      const command = alterCommands[i];
      console.log(`Ejecutando comando ${i + 1}/${alterCommands.length}...`);
      await prisma.$executeRawUnsafe(command);
    }
    
    // Actualizar el registro existente con datos completos
    console.log('Actualizando registro existente...');
    await prisma.$executeRawUnsafe(`
      UPDATE "company_settings" 
      SET 
        "name" = COALESCE("name", 'Ferretería El Martillo'),
        "business_name" = COALESCE("business_name", 'Ferretería El Martillo S.A. de C.V.'),
        "tax_id" = COALESCE("tax_id", 'FEM123456789'),
        "city" = COALESCE("city", 'Ciudad de México'),
        "state" = COALESCE("state", 'Ciudad de México'),
        "country" = COALESCE("country", 'México'),
        "postal_code" = COALESCE("postal_code", '01000'),
        "currency" = COALESCE("currency", 'MXN'),
        "timezone" = COALESCE("timezone", 'America/Mexico_City'),
        "fiscal_year" = COALESCE("fiscal_year", 'enero'),
        "tax_percentage" = COALESCE("tax_percentage", 16.0),
        "invoice_prefix" = COALESCE("invoice_prefix", 'FAC'),
        "quote_prefix" = COALESCE("quote_prefix", 'COT'),
        "receipt_prefix" = COALESCE("receipt_prefix", 'REC'),
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = 'company-settings-1'
    `);
    
    console.log('✅ Configuración de empresa actualizada exitosamente');
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCompanySettings();
