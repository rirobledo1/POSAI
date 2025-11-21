@echo off
echo ========================================
echo  MIGRANDO PLANES A NUEVA ESTRUCTURA
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
echo Este script:
echo - Agregara las nuevas columnas a la tabla existente
echo - Migrara los datos de las columnas viejas
echo - Insertara/actualizara los 4 planes
echo.

REM Ejecutar el script SQL
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f migrar-planes-nuevos.sql

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo  ✅ MIGRACIÓN COMPLETADA CORRECTAMENTE
    echo ========================================
    echo.
    echo Planes configurados:
    echo - FREE: $0 MXN
    echo - PRO: $799 MXN/mes (incluye cotizaciones)
    echo - PRO PLUS: $1,499 MXN/mes (ventas WhatsApp + IA)
    echo - ENTERPRISE: $2,999 MXN/mes (IA completa)
    echo.
    echo SIGUIENTE PASO:
    echo 1. Ejecuta: npx prisma db pull
    echo 2. Ejecuta: npx prisma generate
    echo 3. Reinicia el servidor: npm run dev
    echo.
) else (
    echo ========================================
    echo  ❌ ERROR EN LA MIGRACIÓN
    echo ========================================
    echo Revisa el mensaje de error arriba
    echo.
)

pause
