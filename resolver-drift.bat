@echo off
echo ========================================
echo  RESOLVER DRIFT DE MIGRACIONES
echo ========================================
echo.

echo OPCION 1: Crear migracion baseline (Recomendado)
echo   - Marca el estado actual como punto de partida
echo   - NO borra datos
echo   - Crea una migracion desde el estado actual
echo.
echo OPCION 2: Reset completo
echo   - Borra TODOS los datos
echo   - Aplica todas las migraciones desde cero
echo   - Solo usar si NO tienes datos importantes
echo.
set /p option="Selecciona opcion (1 o 2): "

if "%option%"=="1" goto BASELINE
if "%option%"=="2" goto RESET

echo Opcion invalida
pause
exit /b 1

:BASELINE
echo.
echo ========================================
echo  CREANDO MIGRACION BASELINE
echo ========================================
echo.

echo Paso 1: Generando migracion inicial desde el estado actual...
call npx prisma migrate dev --name baseline_before_multi_tenant --create-only

if %ERRORLEVEL% NEQ 0 (
    echo Error al crear migracion
    pause
    exit /b 1
)

echo.
echo Paso 2: Marcando migracion como aplicada...
call npx prisma migrate resolve --applied baseline_before_multi_tenant

echo.
echo ========================================
echo  BASELINE CREADO EXITOSAMENTE
echo ========================================
echo.
echo Ahora puedes continuar con la migracion multi-tenant
echo.
pause
exit /b 0

:RESET
echo.
echo ========================================
echo  ADVERTENCIA
echo ========================================
echo.
echo Esto borrara TODOS los datos de la base de datos!
echo.
set /p confirm="Estas SEGURO? (escribe SI en mayusculas): "

if not "%confirm%"=="SI" (
    echo Cancelado.
    pause
    exit /b 1
)

echo.
echo Ejecutando reset...
call npx prisma migrate reset --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  RESET COMPLETADO
    echo ========================================
    echo.
    echo La base de datos ha sido reseteada
    echo.
    pause
    exit /b 0
) else (
    echo.
    echo Error en el reset
    pause
    exit /b 1
)
