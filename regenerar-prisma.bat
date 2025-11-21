@echo off
echo ========================================
echo  REGENERAR CLIENTE DE PRISMA
echo ========================================
echo.

echo Generando cliente de Prisma...
echo.

call npx prisma generate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  CLIENTE REGENERADO EXITOSAMENTE
    echo ========================================
    echo.
    echo Ahora puedes continuar con la verificacion
    echo.
    pause
    exit /b 0
) else (
    echo.
    echo ========================================
    echo  ERROR AL REGENERAR CLIENTE
    echo ========================================
    echo.
    pause
    exit /b 1
)
