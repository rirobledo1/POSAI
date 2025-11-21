@echo off
echo ========================================
echo  PASO 3: MIGRAR DATOS EXISTENTES
echo  (Asignar todos los registros a compania)
echo ========================================
echo.

echo Ejecutando: node scripts/migrate-to-multi-tenant.js
echo.

call node scripts/migrate-to-multi-tenant.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  DATOS MIGRADOS EXITOSAMENTE
    echo ========================================
    echo.
    echo Presiona cualquier tecla para continuar con el paso 4...
    pause > nul
) else (
    echo.
    echo ========================================
    echo  ERROR AL MIGRAR DATOS
    echo ========================================
    echo Por favor revisa los errores arriba
    echo.
    pause
    exit /b 1
)
