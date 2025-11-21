@echo off
echo ========================================
echo  CONVERTIR USUARIO EN SUPER ADMIN
echo ========================================
echo.
echo ⚠️  IMPORTANTE: Antes de ejecutar este script
echo     abre el archivo convertir-super-admin.sql
echo     y cambia 'TU_EMAIL@ejemplo.com' por tu email real
echo.
pause
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
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f convertir-super-admin.sql

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo  ✅ SUPER ADMIN CONFIGURADO
    echo ========================================
    echo.
    echo Ahora puedes acceder a:
    echo http://localhost:3000/admin/subscription-plans
    echo.
    echo IMPORTANTE: Cierra sesión y vuelve a iniciar
    echo para que los cambios surtan efecto.
    echo.
) else (
    echo ========================================
    echo  ❌ ERROR
    echo ========================================
    echo.
    echo Verifica que hayas cambiado el email
    echo en el archivo convertir-super-admin.sql
    echo.
)

pause
