@echo off
echo ============================================
echo  GeoNarrative AI — Full Stack Launcher
echo ============================================
echo.

:: Start Backend in a new terminal window
echo [1/2] Launching Backend Server...
start "GeoNarrative Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && pip install bcrypt>=4.0.0 --quiet 2>nul && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to initialize
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

:: Start Frontend in a new terminal window  
echo [2/2] Launching Frontend Server...
start "GeoNarrative Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo  Both servers launching in separate windows!
echo  Backend: http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API Docs: http://localhost:8000/docs
echo ============================================
echo.
pause
