@echo off
echo ========================================
echo  PASO 5: HACER CAMPOS OBLIGATORIOS
echo ========================================
echo.

echo Parte 1: Modificando schema.prisma...
echo.
call node scripts/make-fields-required.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR al modificar el schema
    pause
    exit /b 1
)

echo.
echo Parte 2: Ejecutando migracion...
echo.
call npx prisma migrate dev --name make_company_id_required

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  CAMPOS AHORA SON OBLIGATORIOS
    echo ========================================
    echo.
    echo La Fase 1 esta COMPLETA!
    echo.
    echo Presiona cualquier tecla para continuar...
    pause > nul
) else (
    echo.
    echo ========================================
    echo  ERROR EN LA MIGRACION
    echo ========================================
    echo Por favor revisa los errores arriba
    echo.
    pause
    exit /b 1
)
