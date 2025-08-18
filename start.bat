@echo off
echo Starting LinkedIn Scraper Application...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node src/server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting up...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
