@echo off
title Se pronuncia GIF, no JIF
cls

echo ===========================================
echo   Se pronuncia GIF, no JIF
echo   Creador y Extractor de Frames
echo ===========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Si acabas de instalar Node.js, por favor reinicia la computadora.
    echo Descargalo desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo Iniciando el servidor local...
start /B node server.js

timeout /t 2 /nobreak >nul

echo Abriendo tu navegador en http://localhost:3000 ...
start http://localhost:3000

echo.
echo ===========================================
echo   Servidor corriendo en http://localhost:3000
echo   Apreta Control + C para cerrarlo
echo ===========================================
echo.
echo Ahi te abri el navegador...
echo.

:wait
timeout /t 1 >nul
goto wait
