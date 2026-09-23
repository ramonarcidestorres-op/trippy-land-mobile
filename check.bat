@echo off
echo Descargando herramienta de diagnostico...
call npm install typescript --no-save > nul 2>&1
echo Revisando el codigo fuente...
call .\node_modules\.bin\tsc --noEmit > ts_errors.txt 2>&1
echo ==============================================
echo Proceso finalizado. El error real ya esta guardado.
echo Abre el archivo ts_errors.txt y pegame su contenido.
echo ==============================================
pause
