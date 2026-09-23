@echo off
echo ==============================================
echo Subiendo tus cambios a Lovable
echo ==============================================

git add .
set /p commit_msg="Introduce un mensaje (Enter para 'Actualizacion'): "
if "%commit_msg%"=="" set commit_msg=Actualizacion
git commit -m "%commit_msg%"
git push origin main

echo ==============================================
echo Proceso finalizado. Revisa que no haya errores.
echo ==============================================
pause
