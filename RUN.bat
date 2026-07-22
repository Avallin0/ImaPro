@echo off
title ImaPro Frontend
cd /d "%~dp0"

echo Iniciando ImaPro...
echo Carpeta actual:
cd
echo.

start http://127.0.0.1:5500/Datos/frontend/landing.html

py -m http.server 5500

pause