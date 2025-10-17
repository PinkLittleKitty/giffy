@echo off
echo Se pronuncia gif btw
echo.
echo El server va a abrirse y te va a abrir el navegador
echo Apretá Control + C para cerrarlo
echo.

REM Start the server in background
start /B node server.js

REM Wait a moment for server to start
timeout /t 2 /nobreak >nul

REM Open browser
start http://localhost:3000

REM Keep the window open to show server logs
echo.
echo ✅ Ahí te abrí el navegador...
echo.
echo Logs:
echo ============

REM Wait for the background server process
:wait
timeout /t 1 >nul
goto wait