@echo off
echo Instalando typescript temporalmente (esto toma unos segundos)...
call npm install typescript --no-save > nul 2>&1
echo Revisando errores de codigo...
call npx tsc --noEmit > ts_errors.txt 2>&1
echo ==============================================
echo Proceso finalizado. Por favor, avísame en el chat.
echo ==============================================
pause
