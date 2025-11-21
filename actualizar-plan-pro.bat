@echo off
chcp 65001 > nul
echo ========================================
echo  ACTUALIZAR PLAN A PRO - El Tornillo
echo ========================================
echo.

REM Leer variables de entorno
for /f "tokens=1,2 delims==" %%a in ('type .env.local ^| findstr /v "^#"') do set %%a=%%b

REM Construir URL de conexión
set "DB_URL=postgresql://postgres.vvvyxcigzqifnxdpagag:%DATABASE_PASSWORD%@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo 🔍 Conectando a la base de datos...
echo.

docker run --rm -i ^
  -e PGPASSWORD=%DATABASE_PASSWORD% ^
  postgres:15-alpine psql ^
  "%DB_URL%" ^
  -f - < actualizar-plan-pro.sql

if %errorlevel% equ 0 (
  echo.
  echo ✅ ¡Plan actualizado a PRO exitosamente!
  echo.
  echo 📊 Nuevos límites:
  echo    - Sucursales: 5
  echo    - Usuarios: 10
  echo.
  echo 💡 Recarga la página para ver los cambios
) else (
  echo.
  echo ❌ Error al actualizar el plan
  echo.
  echo 🔧 Verifica:
  echo    1. Docker está corriendo
  echo    2. Las credenciales en .env.local son correctas
)

echo.
pause
