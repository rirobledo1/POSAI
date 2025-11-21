#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Iniciando migración manual...');
    
    // Comandos SQL individuales
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "entity_type" TEXT NOT NULL,
        "entity_id" TEXT,
        "details" JSONB,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
      )`,
      
      `CREATE TABLE IF NOT EXISTS "company_settings" (
        "id" TEXT NOT NULL,
        "company_name" TEXT NOT NULL,
        "rfc" TEXT NOT NULL,
        "address" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "website" TEXT,
        "logo_url" TEXT,
        "tax_regime" TEXT,
        "invoice_series_prefix" TEXT,
        "invoice_next_number" INTEGER NOT NULL DEFAULT 1,
        "pos_title" TEXT,
        "receipt_footer" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
      )`,
      
      `CREATE TABLE IF NOT EXISTS "product_categories" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "parent_id" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
      )`,
      
      `INSERT INTO "company_settings" ("id", "company_name", "rfc", "created_at", "updated_at") 
       VALUES ('company-settings-1', 'Mi Empresa', 'XAXX010101000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       ON CONFLICT ("id") DO NOTHING`
    ];
    
    // Ejecutar cada comando individualmente
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`Ejecutando comando ${i + 1}/${sqlCommands.length}...`);
      await prisma.$executeRawUnsafe(command);
    }
    
    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
