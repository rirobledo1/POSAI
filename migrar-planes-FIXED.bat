@echo off
echo ========================================
echo  MIGRACIÓN DE PLANES - VERSIÓN CORREGIDA
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
echo - Corrige el DEFAULT del campo ID
echo - Agrega las nuevas columnas
echo - Elimina planes viejos
echo - Reinserta los 4 planes con datos correctos
echo.

REM Ejecutar el script SQL
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f migrar-planes-FIXED.sql

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
    echo ========================================
    echo.
    echo Planes configurados:
    echo.
    echo 1. FREE: $0 MXN
    echo    - 1 sucursal, 2 usuarios
    echo    - Funciones básicas
    echo.
    echo 2. PRO: $799 MXN/mes
    echo    - 5 sucursales, usuarios ilimitados
    echo    - Cotizaciones (online, presencial, WhatsApp)
    echo.
    echo 3. PRO PLUS: $1,499 MXN/mes
    echo    - 10 sucursales
    echo    - Ventas por WhatsApp + Agentes IA
    echo.
    echo 4. ENTERPRISE: $2,999 MXN/mes
    echo    - Ilimitado
    echo    - IA completa (robos, anomalías, predicción)
    echo.
    echo ========================================
    echo  📋 SIGUIENTES PASOS:
    echo ========================================
    echo.
    echo 1. Ejecuta: npx prisma db pull
    echo 2. Ejecuta: npx prisma generate
    echo 3. Reinicia: npm run dev
    echo 4. Ve a: http://localhost:3000/settings/subscription
    echo.
) else (
    echo ========================================
    echo  ❌ ERROR EN LA MIGRACIÓN
    echo ========================================
    echo Revisa el mensaje de error arriba
    echo.
)

pause
