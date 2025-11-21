@echo off
chcp 65001 > nul
echo ========================================
echo  LIMPIAR Y REGENERAR PRISMA
echo ========================================
echo.

echo 🛑 Deteniendo procesos de Node.js...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
  echo ✅ Procesos de Node detenidos
) else (
  echo ℹ️  No hay procesos de Node corriendo
)

echo.
echo 🛑 Deteniendo VS Code...
taskkill /F /IM Code.exe 2>nul
if %errorlevel% equ 0 (
  echo ✅ VS Code detenido
) else (
  echo ℹ️  VS Code no está corriendo
)

echo.
echo ⏳ Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo 🔧 Eliminando archivos temporales de Prisma...
if exist "node_modules\.prisma\client\*.tmp*" (
  del /Q "node_modules\.prisma\client\*.tmp*" 2>nul
  echo ✅ Archivos temporales eliminados
)

echo.
echo 🔧 Regenerando Prisma Client...
call npx prisma generate

if %errorlevel% equ 0 (
  echo.
  echo ========================================
  echo  ✅ PRISMA REGENERADO EXITOSAMENTE
  echo ========================================
  echo.
  echo 🚀 Ahora puedes ejecutar:
  echo    npm run dev
  echo.
) else (
  echo.
  echo ========================================
  echo  ❌ ERROR AL REGENERAR PRISMA
  echo ========================================
  echo.
  echo 💡 Soluciones:
  echo    1. Cierra VS Code completamente
  echo    2. Cierra todas las terminales
  echo    3. Ejecuta este script nuevamente
  echo    4. Si persiste, reinicia Windows
  echo.
)

pause
