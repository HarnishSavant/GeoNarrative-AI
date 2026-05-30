@echo off
echo Starting GeoNarrative AI...
echo.

echo Starting Backend Server (port 8000)...
start "GeoNarrative Backend" cmd /k "cd /d %~dp0backend && if exist venv\Scripts\activate.bat ( call venv\Scripts\activate.bat && python main.py ) else ( python main.py )"

timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server (port 3000)...
start "GeoNarrative Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   GeoNarrative AI is starting!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ============================================

start http://localhost:3000
