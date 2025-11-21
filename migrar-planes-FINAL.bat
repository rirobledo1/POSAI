@echo off
echo ========================================
echo  MIGRACIÓN FINAL DE PLANES
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
echo Este script FINAL:
echo - Hace que columnas viejas permitan NULL
echo - Agrega columnas nuevas MXN/USD
echo - Elimina planes anteriores
echo - Inserta los 4 planes correctamente
echo.

REM Ejecutar el script SQL
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f migrar-planes-FINAL.sql

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo  ✅✅✅ MIGRACIÓN EXITOSA ✅✅✅
    echo ========================================
    echo.
    echo 🎉 Los 4 planes se configuraron correctamente:
    echo.
    echo 📦 FREE: $0 MXN
    echo    └─ 1 sucursal, 2 usuarios
    echo.
    echo 💼 PRO: $799 MXN/mes (MÁS POPULAR)
    echo    └─ Cotizaciones: online, presencial, WhatsApp
    echo.
    echo 🚀 PRO PLUS: $1,499 MXN/mes
    echo    └─ Ventas WhatsApp + Agentes IA
    echo.
    echo 👑 ENTERPRISE: $2,999 MXN/mes
    echo    └─ IA completa: robos, anomalías, predicción
    echo.
    echo ========================================
    echo  📋 SIGUIENTES PASOS:
    echo ========================================
    echo.
    echo 1. npx prisma db pull
    echo 2. npx prisma generate
    echo 3. npm run dev
    echo 4. Abre: http://localhost:3000/settings/subscription
    echo.
    echo ¡Verás los 4 planes con diseño mejorado!
    echo.
) else (
    echo ========================================
    echo  ❌ ERROR
    echo ========================================
    echo Por favor copia el error y compártelo
    echo.
)

pause
