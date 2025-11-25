@echo off
echo ==========================================
echo AGREGAR TABLA PASSWORD RESET TOKENS
echo ==========================================
echo.

REM Leer DATABASE_URL del archivo .env
for /f "tokens=2 delims==" %%a in ('findstr /R "^DATABASE_URL" .env') do set DATABASE_URL=%%a

echo Ejecutando script SQL...
echo.

psql %DATABASE_URL% -f add-password-reset-table.sql

echo.
echo ==========================================
echo COMPLETADO
echo ==========================================
echo.
pause
