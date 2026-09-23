@echo off
echo ==============================================
echo  Sincronizando cambios con GitHub y Lovable
echo ==============================================

echo.
echo [1/3] Añadiendo archivos modificados...
git add .

echo.
echo [2/3] Creando commit...
set /p commit_msg="Introduce un mensaje para el commit (o presiona Enter para usar 'Actualizacion de frontend'): "
if "%commit_msg%"=="" set commit_msg=Actualizacion de frontend
git commit -m "%commit_msg%"

echo.
echo [3/3] Subiendo cambios...
git push origin main

echo.
echo ==============================================
echo  ¡Proceso finalizado! 
echo  Tus cambios ya se estan sincronizando con Lovable.
echo ==============================================
pause
