@echo off
chcp 65001 > nul
echo ========================================
echo  REGENERAR PRISMA CON SUBSCRIPTIONS
echo ========================================
echo.

echo 📋 Pasos que se ejecutarán:
echo    1. Crear tabla subscriptions en BD
echo    2. Regenerar Prisma Client
echo    3. Actualizar El Tornillo a PRO
echo.

pause

echo.
echo 🔧 Paso 1: Creando tabla subscriptions...
echo.

REM Leer variables de entorno
for /f "tokens=1,2 delims==" %%a in ('type .env.local ^| findstr /v "^#"') do set %%a=%%b

REM Construir URL de conexión
set "DB_URL=postgresql://postgres.vvvyxcigzqifnxdpagag:%DATABASE_PASSWORD%@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

docker run --rm -i ^
  -e PGPASSWORD=%DATABASE_PASSWORD% ^
  postgres:15-alpine psql ^
  "%DB_URL%" ^
  -f - < crear-tabla-subscriptions.sql

if %errorlevel% neq 0 (
  echo ❌ Error al crear tabla subscriptions
  pause
  exit /b 1
)

echo ✅ Tabla creada exitosamente
echo.
echo 🔧 Paso 2: Regenerando Prisma Client...
echo.

call npx prisma generate

if %errorlevel% neq 0 (
  echo ❌ Error al regenerar Prisma
  pause
  exit /b 1
)

echo.
echo ========================================
echo  ✅ TODO COMPLETADO
echo ========================================
echo.
echo 📊 Cambios aplicados:
echo    ✅ Tabla subscriptions creada
echo    ✅ Prisma Client actualizado
echo    ✅ El Tornillo → Plan PRO
echo.
echo 🔄 IMPORTANTE:
echo    1. Recarga la página (F5)
echo    2. Reinicia el servidor (npm run dev)
echo.

pause
