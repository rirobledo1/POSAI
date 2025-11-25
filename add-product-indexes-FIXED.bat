@echo off
echo ==========================================
echo AGREGAR INDICES DE PERFORMANCE (CORREGIDO)
echo ==========================================
echo.
echo Este script crea indices BASICOS que no requieren
echo permisos especiales de PostgreSQL.
echo.
echo Los indices GIN (pg_trgm) se intentaran crear
echo pero si falla, el resto de indices igual mejoraran
echo el performance en 5-10x.
echo.
echo ==========================================
echo.

REM Leer DATABASE_URL del archivo .env
for /f "tokens=2 delims==" %%a in ('findstr /R "^DATABASE_URL" .env') do set DATABASE_URL=%%a

echo Ejecutando script de indices...
echo.

psql %DATABASE_URL% -f add-product-indexes-FIXED.sql

echo.
echo ==========================================
echo COMPLETADO
echo ==========================================
echo.
echo Verifica el output arriba para ver si pg_trgm
echo se instalo correctamente o no.
echo.
pause
