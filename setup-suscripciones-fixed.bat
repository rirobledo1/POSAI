@echo off
echo ========================================
echo  SETUP SISTEMA DE SUSCRIPCIONES
echo ========================================
echo.

echo Este script va a:
echo    1. Crear tablas de planes y pagos
echo    2. Insertar planes iniciales (FREE, PRO, ENTERPRISE)
echo    3. Actualizar tabla subscriptions
echo    4. Regenerar Prisma Client
echo.

pause

echo.
echo Paso 1: Creando tablas en base de datos...
echo.

REM Leer variables de entorno
for /f "tokens=1,2 delims==" %%a in ('type .env.local ^| findstr /v "^#"') do set %%a=%%b

REM Construir URL de conexion
set "DB_URL=postgresql://postgres.vvvyxcigzqifnxdpagag:%DATABASE_PASSWORD%@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

docker run --rm -i -e PGPASSWORD=%DATABASE_PASSWORD% postgres:15-alpine psql "%DB_URL%" -f - < crear-sistema-suscripciones.sql

if %errorlevel% neq 0 (
  echo Error al crear tablas
  pause
  exit /b 1
)

echo Tablas creadas exitosamente
echo.
echo Paso 2: Limpiando cache de Next.js...
echo.

rmdir /s /q .next 2>nul
echo Cache limpiado

echo.
echo Paso 3: Regenerando Prisma Client...
echo.

call npx prisma generate

if %errorlevel% neq 0 (
  echo Error al regenerar Prisma
  pause
  exit /b 1
)

echo.
echo ========================================
echo  TODO COMPLETADO
echo ========================================
echo.
echo Sistema de suscripciones instalado:
echo    - Tabla subscription_plans creada
echo    - Tabla payment_history creada  
echo    - 3 planes configurados (FREE, PRO, ENTERPRISE)
echo    - Prisma Client actualizado
echo.
echo Planes creados:
echo    - FREE: $0/mes (30 dias trial)
echo    - PRO: $399/mes o $3,999/año (16%% descuento)
echo    - ENTERPRISE: $1,299/mes o $12,999/año (16%% descuento)
echo.
echo IMPORTANTE:
echo    1. Reinicia el servidor: npm run dev
echo    2. Los precios son editables desde el panel de admin
echo.

pause
