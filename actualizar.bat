@echo off
echo ==============================================
echo Configurando iconos de la App...
echo ==============================================
if exist "public\tripi-logo-app.png" (
    copy /Y "public\tripi-logo-app.png" "public\icon-512.png" >nul
    copy /Y "public\tripi-logo-app.png" "public\favicon.png" >nul
    copy /Y "public\tripi-logo-app.png" "public\icon-192.png" >nul
    copy /Y "public\tripi-logo-app.png" "public\apple-touch-icon.png" >nul
    echo Iconos actualizados con tripi-logo-app.png correctamente.
)

node scripts/generate_app_icons.mjs 2>nul

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
