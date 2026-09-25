@echo off
cls
echo ==============================================
echo       TRIPPY LAND STORE - ACTUALIZADOR
echo ==============================================
echo.

echo [1/3] Sincronizando iconos de la app...
if exist "public\tripi-logo-app.png" (
    copy /Y "public\tripi-logo-app.png" "public\icon-512.png" >nul
    copy /Y "public\tripi-logo-app.png" "public\favicon.png" >nul
    copy /Y "public\tripi-logo-app.png" "public\icon-192.png" >nul
    copy /Y "public\tripi-logo-app.png" "public\apple-touch-icon.png" >nul
    echo       Iconos PWA copiados correctamente.
)

echo [2/3] Generando sonidos de notificacion...
node scripts\generate_sound.mjs >nul 2>&1
echo       Sonidos listos.

echo [3/3] Guardando cambios y subiendo a Lovable...
git add -A
git commit -m "Actualizacion Trippy Land Store"
git push origin main

echo.
echo ==============================================
echo       PROCESO COMPLETADO CON EXITO
echo ==============================================
echo.
pause
