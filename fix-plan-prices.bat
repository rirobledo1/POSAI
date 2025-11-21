@echo off
echo =========================================
echo  CORREGIR PRECIOS DE PLANES
echo =========================================
echo.

REM Obtener credenciales de PostgreSQL del .env
for /f "tokens=1,2 delims==" %%a in ('findstr /r "DATABASE_URL" .env') do set DATABASE_URL=%%b

echo DATABASE_URL encontrado
echo.

REM Ejecutar el script SQL
echo Ejecutando correcciones...
psql "%DATABASE_URL%" -f fix-plan-prices.sql

if %errorlevel% equ 0 (
    echo.
    echo =========================================
    echo  PRECIOS ACTUALIZADOS CORRECTAMENTE
    echo =========================================
    echo.
    echo FREE: $0 MXN/mes
    echo PRO: $799 MXN/mes - $8,068 MXN/año
    echo PRO PLUS: $1,499 MXN/mes - $15,110 MXN/año  
    echo ENTERPRISE: $2,999 MXN/mes - $30,230 MXN/año
    echo.
) else (
    echo.
    echo =========================================
    echo  ERROR AL ACTUALIZAR PRECIOS
    echo =========================================
    echo.
    echo Verifica que PostgreSQL este corriendo
    echo y que la DATABASE_URL en .env sea correcta
    echo.
)

pause
