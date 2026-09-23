@echo off
echo Revisando errores de TypeScript...
call npx tsc --noEmit > ts_errors.txt 2>&1
echo Revisando errores de Vite...
call npm run build > vite_errors.txt 2>&1
echo ==============================================
echo Proceso finalizado. Por favor, avísame en el chat.
echo ==============================================
pause
