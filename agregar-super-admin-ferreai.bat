@echo off
echo ========================================
echo  AGREGAR admin@ferreai.com COMO SUPER ADMIN
echo ========================================
echo.

REM Configuración de la base de datos
set PGPASSWORD=root
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=ferreai
set DB_USER=postgres

echo Conectando a PostgreSQL...
echo Email: admin@ferreai.com
echo.

REM Ejecutar el script SQL
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f agregar-super-admin-ferreai.sql

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo  ✅ SUPER ADMIN CONFIGURADO
    echo ========================================
    echo.
    echo Usuario: admin@ferreai.com
    echo Estado: SUPER ADMIN
    echo.
    echo IMPORTANTE:
    echo 1. Cierra sesión en el navegador
    echo 2. Reinicia el servidor: npm run dev
    echo 3. Vuelve a iniciar sesión
    echo 4. Abre el menú lateral
    echo 5. Verás la opción: 👑 Admin Planes
    echo.
) else (
    echo ========================================
    echo  ❌ ERROR
    echo ========================================
    echo Verifica que el usuario existe
    echo.
)

pause
