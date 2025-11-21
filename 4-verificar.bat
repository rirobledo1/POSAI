@echo off
echo ========================================
echo  PASO 4: VERIFICAR MIGRACION
echo ========================================
echo.

echo Ejecutando: node scripts/verify-multi-tenant.js
echo.

call node scripts/verify-multi-tenant.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Presiona cualquier tecla para continuar...
    pause > nul
) else (
    echo.
    echo ========================================
    echo  SE ENCONTRARON ERRORES
    echo ========================================
    echo Por favor revisa los errores arriba
    echo.
    pause
    exit /b 1
)
