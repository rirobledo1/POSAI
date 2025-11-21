@echo off
echo ========================================
echo  VERIFICANDO DOCKER
echo ========================================
echo.

echo Buscando contenedores de PostgreSQL...
echo.

docker ps -a --filter "ancestor=postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ========================================
echo.
echo Si ves un contenedor arriba, copia su NOMBRE EXACTO
echo.
pause
