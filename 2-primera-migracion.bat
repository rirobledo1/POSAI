@echo off
echo ========================================
echo  PASO 2: PRIMERA MIGRACION
echo  (Agregar campos opcionales)
echo ========================================
echo.

echo Ejecutando: npx prisma migrate dev --name add_multi_tenant_fields_optional
echo.

call npx prisma migrate dev --name add_multi_tenant_fields_optional

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  MIGRACION COMPLETADA EXITOSAMENTE
    echo ========================================
    echo.
    echo Presiona cualquier tecla para continuar con el paso 3...
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
