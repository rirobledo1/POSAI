@echo off
chcp 65001 > nul
echo ========================================
echo  CREAR TABLA SUBSCRIPTIONS Y PLAN PRO
echo ========================================
echo.

REM Leer variables de entorno
for /f "tokens=1,2 delims==" %%a in ('type .env.local ^| findstr /v "^#"') do set %%a=%%b

REM Construir URL de conexión
set "DB_URL=postgresql://postgres.vvvyxcigzqifnxdpagag:%DATABASE_PASSWORD%@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo 🔍 Conectando a la base de datos...
echo.
echo 📋 Este script va a:
echo    1. Crear tabla subscriptions
echo    2. Agregar índices y triggers
echo    3. Crear suscripción FREE para todas las empresas
echo    4. Actualizar El Tornillo a plan PRO
echo.

docker run --rm -i ^
  -e PGPASSWORD=%DATABASE_PASSWORD% ^
  postgres:15-alpine psql ^
  "%DB_URL%" ^
  -f - < crear-tabla-subscriptions.sql

if %errorlevel% equ 0 (
  echo.
  echo ========================================
  echo  ✅ TODO COMPLETADO EXITOSAMENTE
  echo ========================================
  echo.
  echo 📊 Tabla subscriptions creada
  echo 📊 Ferretería El Tornillo → Plan PRO
  echo.
  echo 💡 Nuevos límites:
  echo    - Sucursales: 5
  echo    - Usuarios: 10
  echo.
  echo 🔄 IMPORTANTE: Recarga la página (F5)
  echo.
) else (
  echo.
  echo ========================================
  echo  ❌ ERROR AL EJECUTAR
  echo ========================================
  echo.
  echo 🔧 Verifica:
  echo    1. Docker está corriendo
  echo    2. Las credenciales en .env.local
  echo    3. La conexión a internet
)

echo.
pause
