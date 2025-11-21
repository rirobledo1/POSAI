@echo off
color 0A
title Migracion Multi-Tenant - FerreAI

:MENU
cls
echo.
echo ========================================
echo   MIGRACION A MULTI-TENANT - FERREAI
echo ========================================
echo.
echo  Selecciona el paso a ejecutar:
echo.
echo  0. Verificar Sistema (Docker, BD, etc)
echo.
echo  1. Paso 1: Crear Backup de la BD
echo  2. Paso 2: Primera Migracion (campos opcionales)
echo  3. Paso 3: Migrar Datos Existentes
echo  4. Paso 4: Verificar Migracion
echo  5. Paso 5: Hacer Campos Obligatorios
echo.
echo  A. EJECUTAR TODO AUTOMATICAMENTE (Pasos 1-5)
echo.
echo  X. Salir
echo.
echo ========================================
echo.
set /p option="Ingresa tu opcion: "

if "%option%"=="0" goto VERIFICAR
if "%option%"=="1" goto PASO1
if "%option%"=="2" goto PASO2
if "%option%"=="3" goto PASO3
if "%option%"=="4" goto PASO4
if "%option%"=="5" goto PASO5
if "%option%"=="A" goto AUTO
if "%option%"=="a" goto AUTO
if "%option%"=="X" goto SALIR
if "%option%"=="x" goto SALIR

echo Opcion invalida. Presiona cualquier tecla para continuar...
pause > nul
goto MENU

:VERIFICAR
cls
call 0-verificar-sistema.bat
goto MENU

:PASO1
cls
call 1-backup.bat
goto MENU

:PASO2
cls
call 2-primera-migracion.bat
goto MENU

:PASO3
cls
call 3-migrar-datos.bat
goto MENU

:PASO4
cls
call 4-verificar.bat
goto MENU

:PASO5
cls
echo ========================================
echo  PASO 5: HACER CAMPOS OBLIGATORIOS
echo ========================================
echo.
echo Este paso requiere:
echo 1. Modificar el schema.prisma manualmente
echo 2. Cambiar todos los companyId String? a String
echo 3. Ejecutar: npx prisma migrate dev --name make_company_id_required
echo.
echo Te guiare a traves de este proceso...
echo.
pause
goto MENU

:AUTO
cls
echo ========================================
echo  EJECUCION AUTOMATICA
echo ========================================
echo.
echo Se ejecutaran los pasos 1 al 5 automaticamente.
echo.
echo ADVERTENCIA: Asegurate de que:
echo - Docker este corriendo
echo - La base de datos este accesible
echo - No haya cambios sin guardar
echo.
set /p confirm="Deseas continuar? (S/N): "
if /i not "%confirm%"=="S" goto MENU

echo.
echo Iniciando proceso automatico...
echo.

REM PASO 1: Backup
echo.
echo ========================================
echo  EJECUTANDO PASO 1: BACKUP
echo ========================================
echo.
call 1-backup.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en Paso 1. Abortando...
    pause
    goto MENU
)

REM PASO 2: Primera Migración
echo.
echo ========================================
echo  EJECUTANDO PASO 2: PRIMERA MIGRACION
echo ========================================
echo.
call 2-primera-migracion.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en Paso 2. Abortando...
    pause
    goto MENU
)

REM PASO 3: Migrar Datos
echo.
echo ========================================
echo  EJECUTANDO PASO 3: MIGRAR DATOS
echo ========================================
echo.
call 3-migrar-datos.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en Paso 3. Abortando...
    pause
    goto MENU
)

REM PASO 4: Verificar
echo.
echo ========================================
echo  EJECUTANDO PASO 4: VERIFICAR
echo ========================================
echo.
call 4-verificar.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en Paso 4. Abortando...
    pause
    goto MENU
)

REM PASO 5: Hacer campos obligatorios
echo.
echo ========================================
echo  EJECUTANDO PASO 5: CAMPOS OBLIGATORIOS
echo ========================================
echo.
call 5-campos-obligatorios.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR en Paso 5. Abortando...
    pause
    goto MENU
)

echo.
echo ========================================
echo  PROCESO AUTOMATICO COMPLETADO
echo ========================================
echo.
echo Todos los pasos se ejecutaron exitosamente!
echo.
echo ✅ FASE 1 COMPLETADA AL 100%%
echo.
echo SIGUIENTE:
echo - Continua con la Fase 2 (Autenticacion)
echo.
pause
goto MENU

:SALIR
cls
echo.
echo Saliendo...
echo.
exit

