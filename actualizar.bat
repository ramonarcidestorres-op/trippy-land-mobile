@echo off
echo ==============================================
echo Sincronizando cambios con GitHub y Lovable
echo ==============================================

echo [1/4] Descargando cambios de Lovable (git pull)...
git pull origin main

echo [2/4] Anadiendo archivos modificados...
git add .

echo [3/4] Creando commit...
set /p commit_msg="Introduce un mensaje (Enter para 'Actualizacion'): "
if "%commit_msg%"=="" set commit_msg=Actualizacion
git commit -m "%commit_msg%"

echo [4/4] Subiendo cambios (git push)...
git push origin main

echo ==============================================
echo Proceso finalizado. 
echo Revisa arriba si hubo algun error en rojo.
echo ==============================================
pause
