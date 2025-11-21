@echo off
echo ========================================
echo  ACTUALIZANDO PLANES CON NUEVOS PRECIOS
echo ========================================
echo.

REM Configuración de la base de datos
set PGPASSWORD=root
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=ferreai
set DB_USER=postgres

echo Conectando a PostgreSQL...
echo Host: %DB_HOST%
echo Puerto: %DB_PORT%
echo Base de datos: %DB_NAME%
echo Usuario: %DB_USER%
echo.

REM Ejecutar el script SQL
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f actualizar-planes-nuevos.sql

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo  ✅ PLANES ACTUALIZADOS CORRECTAMENTE
    echo ========================================
    echo.
    echo Planes configurados:
    echo - FREE: $0 MXN
    echo - PRO: $799 MXN/mes (incluye cotizaciones)
    echo - PRO PLUS: $1,499 MXN/mes (ventas WhatsApp + IA)
    echo - ENTERPRISE: $2,999 MXN/mes (IA completa)
    echo.
) else (
    echo ========================================
    echo  ❌ ERROR AL ACTUALIZAR PLANES
    echo ========================================
    echo Revisa el mensaje de error arriba
    echo.
)

pause
