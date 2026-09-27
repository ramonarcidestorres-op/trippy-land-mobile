@echo off
cd /d "%~dp0"
cls
echo ==============================================
echo       SUBIENDO FOTOS A SUPABASE STORAGE
echo ==============================================
echo.

node scripts\upload_products_images.mjs

echo.
echo ==============================================
echo       PROCESO FINALIZADO
echo ==============================================
echo.
pause
