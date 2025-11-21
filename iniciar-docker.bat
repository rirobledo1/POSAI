@echo off
echo ========================================
echo  INICIANDO CONTENEDOR DE POSTGRESQL
echo ========================================
echo.

echo Iniciando con docker-compose...
echo.

docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  CONTENEDOR INICIADO EXITOSAMENTE
    echo ========================================
    echo.
    echo Esperando 5 segundos para que PostgreSQL inicie...
    timeout /t 5 /nobreak > nul
    echo.
    echo Verificando contenedor...
    docker ps --filter "ancestor=postgres:15"
    echo.
    echo Presiona cualquier tecla para continuar...
    pause > nul
) else (
    echo.
    echo ========================================
    echo  ERROR AL INICIAR CONTENEDOR
    echo ========================================
    echo.
    pause
    exit /b 1
)
