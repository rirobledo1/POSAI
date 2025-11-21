@echo off
echo =========================================
echo  VERIFICAR Y ACTUALIZAR PLAN PRO
echo =========================================
echo.

REM Obtener credenciales de PostgreSQL del .env
for /f "tokens=1,2 delims==" %%a in ('findstr /r "DATABASE_URL" .env') do set DATABASE_URL=%%b

echo Verificando plan actual...
echo.

REM Ejecutar el script SQL
psql "%DATABASE_URL%" -f verificar-plan-pro.sql

echo.
echo =========================================
echo  VERIFICACION COMPLETADA
echo =========================================
echo.
echo Si tu plan ahora es 'PRO', reinicia el servidor:
echo   1. Presiona Ctrl+C en la terminal del servidor
echo   2. Ejecuta: npm run dev
echo.
echo Luego intenta enviar la cotizacion por WhatsApp nuevamente
echo.

pause
