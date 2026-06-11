@echo off
title RESONANCE Launcher
echo.
echo  ======================================
echo   RESONANCE — Starting local dev servers
echo  ======================================
echo.
echo  Starting backend on http://localhost:5000
start "RESONANCE Backend" cmd /k "cd /d "%~dp0backend" && npm install && npm run dev"
timeout /t 4 /nobreak > nul
echo  Starting frontend on http://localhost:3000
start "RESONANCE Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm start"
echo.
echo  Both servers are starting. Browser will open automatically.
echo  Press any key to close this window.
pause > nul
