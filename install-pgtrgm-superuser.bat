@echo off
echo ==========================================
echo INSTALAR pg_trgm COMO SUPERUSUARIO
echo ==========================================
echo.
echo IMPORTANTE: Este script requiere acceso como
echo superusuario de PostgreSQL (usuario: postgres)
echo.
echo Si no tienes este acceso, usa en su lugar:
echo   add-product-indexes-FIXED.bat
echo.
echo ==========================================
echo.

set /p continue="Tienes acceso como superusuario? (S/N): "
if /i not "%continue%"=="S" (
    echo.
    echo Cancelado. Usa add-product-indexes-FIXED.bat
    pause
    exit /b
)

echo.
echo Ingresa la contraseña del usuario 'postgres' cuando se solicite.
echo.

REM Extraer solo el nombre de la base de datos del DATABASE_URL
for /f "tokens=2 delims==" %%a in ('findstr /R "^DATABASE_URL" .env') do set DATABASE_URL=%%a

REM Intentar extraer el nombre de la base de datos
for /f "tokens=4 delims=/" %%b in ("%DATABASE_URL%") do set DB_NAME=%%b

echo Base de datos: %DB_NAME%
echo.

psql -U postgres -d %DB_NAME% -f install-pgtrgm-superuser.sql

echo.
echo ==========================================
echo.

if %ERRORLEVEL% EQU 0 (
    echo ✅ pg_trgm instalada exitosamente!
    echo.
    echo Ahora ejecuta:
    echo   add-product-indexes-FIXED.bat
) else (
    echo ❌ Error al instalar pg_trgm
    echo.
    echo Posibles causas:
    echo - No tienes permisos de superusuario
    echo - La extension no esta disponible en tu PostgreSQL
    echo.
    echo Solucion:
    echo Usa add-product-indexes-FIXED.bat que funciona sin pg_trgm
)

echo.
pause
