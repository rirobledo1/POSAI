@echo off
echo ==========================================
echo AGREGAR TABLA DE LOGIN ATTEMPTS
echo Para Rate Limiting de Autenticacion
echo ==========================================
echo.

REM Leer DATABASE_URL del archivo .env
for /f "tokens=2 delims==" %%a in ('findstr /R "^DATABASE_URL" .env') do set DATABASE_URL=%%a

echo Ejecutando script de creacion de tabla...
echo.

psql %DATABASE_URL% -f add-login-attempts-table.sql

echo.
echo ==========================================
echo COMPLETADO
echo ==========================================
echo.
echo Ahora ejecuta:
echo   npx prisma db pull
echo   npx prisma generate
echo.
pause
