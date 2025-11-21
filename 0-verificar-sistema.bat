@echo off
echo Verificando Docker...
echo.

docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker no esta corriendo o no esta instalado
    echo.
    echo Por favor:
    echo 1. Abre Docker Desktop
    echo 2. Espera a que inicie completamente
    echo 3. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)

echo ✅ Docker esta corriendo
echo.
echo Verificando contenedor ferreai_postgres...
echo.

docker ps --filter "name=ferreai_postgres" --format "{{.Names}}" | findstr ferreai_postgres >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ El contenedor ferreai_postgres no esta corriendo
    echo.
    echo Por favor ejecuta:
    echo docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo ✅ Contenedor ferreai_postgres esta corriendo
echo.
echo ========================================
echo  SISTEMA LISTO PARA MIGRAR
echo ========================================
echo.
echo Presiona cualquier tecla para continuar...
pause > nul
