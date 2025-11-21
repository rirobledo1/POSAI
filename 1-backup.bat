@echo off
echo ========================================
echo  BACKUP DE BASE DE DATOS - FERREAI
echo ========================================
echo.

REM Configuración
set CONTAINER_NAME=ferreai_postgres
set DB_NAME=ferreai_dev
set DB_USER=postgres
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=backup_ferreai_%TIMESTAMP%.sql

echo Creando backup de la base de datos...
echo Contenedor: %CONTAINER_NAME%
echo Base de datos: %DB_NAME%
echo Archivo: %BACKUP_FILE%
echo.

docker exec -t %CONTAINER_NAME% pg_dump -U %DB_USER% %DB_NAME% > %BACKUP_FILE%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  BACKUP COMPLETADO EXITOSAMENTE
    echo ========================================
    echo Archivo creado: %BACKUP_FILE%
    echo.
    echo Presiona cualquier tecla para continuar con la migracion...
    pause > nul
) else (
    echo.
    echo ========================================
    echo  ERROR AL CREAR EL BACKUP
    echo ========================================
    echo Por favor verifica que Docker este corriendo
    echo y que el contenedor %CONTAINER_NAME% este activo
    echo.
    pause
    exit /b 1
)
